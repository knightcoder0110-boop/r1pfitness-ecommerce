import "server-only";

import type {
  EmailProvider,
  EmitResult,
  EmailProfile,
  ConsentSource,
  OrderLifecycleEvent,
  PlacedOrderPayload,
  RefundedOrderPayload,
  CancelledOrderPayload,
  ShippedOrderPayload,
  PaymentFailedPayload,
  StartedCheckoutPayload,
  NewsletterPayload,
  SubscribeResult,
  EventOrderItem,
} from "../../types";
import { createKlaviyoApi, getKlaviyoApiKey, type KlaviyoApi } from "./api";

/**
 * Klaviyo implementation of the EmailProvider interface.
 *
 * Maps each `OrderLifecycleEvent` to a Klaviyo "Track" call against
 * their `/events/` endpoint, and `newsletter.subscribed` to a profile-
 * subscription bulk-create job.
 */
export const klaviyoProvider: EmailProvider = {
  name: "klaviyo",

  async emit(event: OrderLifecycleEvent): Promise<EmitResult> {
    const apiKey = getKlaviyoApiKey();
    if (!apiKey) {
      return { ok: false, error: "klaviyo not configured" };
    }
    const api = createKlaviyoApi(apiKey);

    switch (event.type) {
      case "order.placed":
        return trackEvent(api, "Placed Order", event.payload, placedOrderProperties);
      case "order.shipped":
        return trackEvent(api, "Shipped Order", event.payload, shippedOrderProperties);
      case "order.delivered":
        return trackEvent(api, "Delivered Order", event.payload, shippedOrderProperties);
      case "order.cancelled":
        return trackEvent(api, "Cancelled Order", event.payload, cancelledOrderProperties);
      case "order.refunded":
        return trackEvent(api, "Refunded Order", event.payload, refundedOrderProperties);
      case "checkout.started":
        return trackEvent(api, "Started Checkout", event.payload, startedCheckoutProperties);
      case "payment.failed":
        return trackEvent(api, "Payment Failed", event.payload, paymentFailedProperties);
      case "newsletter.subscribed":
        return subscribeNewsletter(api, event.payload);
    }
  },

  async subscribeToList(
    listId: string,
    profile: EmailProfile,
    source: ConsentSource,
  ): Promise<SubscribeResult> {
    const apiKey = getKlaviyoApiKey();
    if (!apiKey) {
      return { ok: false, error: "klaviyo not configured" };
    }
    const api = createKlaviyoApi(apiKey);
    return doSubscribe(api, listId, profile, source);
  },
};

// ---------------------------------------------------------------------------
// Generic event dispatcher
// ---------------------------------------------------------------------------

interface HasProfileAndUnique {
  profile: EmailProfile;
  uniqueId?: string;
}

async function trackEvent<P extends HasProfileAndUnique>(
  api: KlaviyoApi,
  metric: string,
  payload: P,
  toProperties: (p: P) => { properties: Record<string, unknown>; value?: number },
): Promise<EmitResult> {
  const { properties, value } = toProperties(payload);

  const body = {
    data: {
      type: "event",
      attributes: {
        properties,
        metric: { data: { type: "metric", attributes: { name: metric } } },
        profile: {
          data: {
            type: "profile",
            attributes: profileAttributes(payload.profile),
          },
        },
        ...(typeof value === "number" ? { value } : {}),
        unique_id: payload.uniqueId ?? undefined,
      },
    },
  };

  const res = await api.postEvent(body);
  if (!res.ok) {
    return {
      ok: false,
      error: `klaviyo ${metric}: HTTP ${res.error.status} ${res.error.message}`,
    };
  }
  return { ok: true, providerEventId: res.data?.id };
}

function profileAttributes(p: EmailProfile): Record<string, unknown> {
  return {
    email: p.email,
    ...(p.firstName ? { first_name: p.firstName } : {}),
    ...(p.lastName ? { last_name: p.lastName } : {}),
    ...(p.phone ? { phone_number: p.phone } : {}),
  };
}

// ---------------------------------------------------------------------------
// Per-event property builders
// ---------------------------------------------------------------------------

function placedOrderProperties(p: PlacedOrderPayload): {
  properties: Record<string, unknown>;
  value: number;
} {
  return {
    properties: {
      OrderId: p.orderId,
      OrderNumber: p.orderNumber,
      Categories: collectCategories(p.items),
      ItemNames: p.items.map((i) => i.name),
      Items: p.items.map(toKlaviyoItem),
      Subtotal: p.subtotal,
      Tax: p.tax,
      Shipping: p.shipping,
      Discount: p.discount,
      DiscountCode: p.discountCode ?? null,
      Total: p.total,
      Currency: p.currency,
      PaymentMethod: p.paymentMethod,
      SourceName: "web",
      SiteUrl: p.siteUrl,
      OrderUrl: p.orderUrl,
      $value: p.total,
    },
    value: p.total,
  };
}

function shippedOrderProperties(p: ShippedOrderPayload): {
  properties: Record<string, unknown>;
} {
  return {
    properties: {
      OrderId: p.orderId,
      OrderNumber: p.orderNumber,
      TrackingNumber: p.trackingNumber,
      TrackingUrl: p.trackingUrl,
      Carrier: p.carrier,
      CarrierName: p.carrierName,
      ShippedAt: p.shippedAt,
      ...(p.estimatedDelivery ? { EstimatedDelivery: p.estimatedDelivery } : {}),
      Items: p.items.map(toKlaviyoItem),
      ItemNames: p.items.map((i) => i.name),
    },
  };
}

function cancelledOrderProperties(p: CancelledOrderPayload): {
  properties: Record<string, unknown>;
} {
  return {
    properties: {
      OrderId: p.orderId,
      OrderNumber: p.orderNumber,
      CancelReason: p.reason,
      Items: p.items.map(toKlaviyoItem),
      ItemNames: p.items.map((i) => i.name),
    },
  };
}

function refundedOrderProperties(p: RefundedOrderPayload): {
  properties: Record<string, unknown>;
  value: number;
} {
  return {
    properties: {
      OrderId: p.orderId,
      OrderNumber: p.orderNumber,
      RefundAmount: p.refundAmount,
      Currency: p.currency,
      IsPartialRefund: p.isPartial,
      ...(p.reason ? { RefundReason: p.reason } : {}),
      $value: p.refundAmount,
    },
    value: p.refundAmount,
  };
}

function startedCheckoutProperties(p: StartedCheckoutPayload): {
  properties: Record<string, unknown>;
  value: number;
} {
  return {
    properties: {
      CheckoutId: p.checkoutId,
      Items: p.items.map(toKlaviyoItem),
      ItemNames: p.items.map((i) => i.name),
      ItemCount: p.itemCount,
      Subtotal: p.subtotal,
      Total: p.total,
      Currency: p.currency,
      CheckoutUrl: p.checkoutUrl,
      $value: p.total,
    },
    value: p.total,
  };
}

function paymentFailedProperties(p: PaymentFailedPayload): {
  properties: Record<string, unknown>;
} {
  return {
    properties: {
      OrderId: p.orderId,
      OrderNumber: p.orderNumber,
      FailureCode: p.failureCode,
      FailureMessage: p.failureMessage,
      RetryUrl: p.retryUrl,
      Items: p.items.map(toKlaviyoItem),
      ItemNames: p.items.map((i) => i.name),
    },
  };
}

function toKlaviyoItem(i: EventOrderItem): Record<string, unknown> {
  return {
    ProductID: i.productId,
    ...(i.variantId ? { VariantID: i.variantId } : {}),
    SKU: i.sku ?? "",
    ProductName: i.name,
    Quantity: i.quantity,
    ItemPrice: i.unitPrice,
    RowTotal: i.rowTotal,
    ProductURL: i.productUrl ?? "",
    ImageURL: i.imageUrl ?? "",
    ProductCategories: i.categories ?? [],
  };
}

function collectCategories(items: ReadonlyArray<EventOrderItem>): string[] {
  const set = new Set<string>();
  for (const i of items) {
    for (const c of i.categories ?? []) set.add(c);
  }
  return Array.from(set);
}

// ---------------------------------------------------------------------------
// Newsletter subscription
// ---------------------------------------------------------------------------

async function subscribeNewsletter(
  api: KlaviyoApi,
  payload: NewsletterPayload,
): Promise<EmitResult> {
  // The newsletter list id is required for this event; the caller is
  // responsible for routing through `subscribeToList` if a non-default
  // list is needed. For this event-typed emission we use the default
  // list configured in env.
  const listId = process.env.KLAVIYO_LIST_ID;
  if (!listId) {
    return { ok: false, error: "KLAVIYO_LIST_ID not configured" };
  }
  const r = await doSubscribe(api, listId, payload.profile, payload.source);
  return r.ok ? { ok: true } : { ok: false, error: r.error };
}

async function doSubscribe(
  api: KlaviyoApi,
  listId: string,
  profile: EmailProfile,
  source: ConsentSource,
): Promise<SubscribeResult> {
  const body = {
    data: {
      type: "profile-subscription-bulk-create-job",
      attributes: {
        custom_source: source,
        profiles: {
          data: [
            {
              type: "profile",
              attributes: {
                ...profileAttributes(profile),
                subscriptions: {
                  email: { marketing: { consent: "SUBSCRIBED" } },
                },
              },
            },
          ],
        },
      },
      relationships: {
        list: { data: { type: "list", id: listId } },
      },
    },
  };

  const res = await api.postSubscriptionJob(body);
  if (!res.ok) {
    return { ok: false, error: `klaviyo subscribe: HTTP ${res.error.status}` };
  }
  return { ok: true };
}
