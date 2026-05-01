import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/woo/client", () => ({ adminFetch: vi.fn() }));

import {
  parseTrackingFromMetaData,
  buildCarrierTrackingUrl,
} from "./shipment";

describe("parseTrackingFromMetaData", () => {
  it("returns null when meta is missing", () => {
    expect(parseTrackingFromMetaData(null)).toBeNull();
    expect(parseTrackingFromMetaData(undefined)).toBeNull();
    expect(parseTrackingFromMetaData([])).toBeNull();
  });

  it("returns null when no shipment-tracking key is present", () => {
    expect(
      parseTrackingFromMetaData([{ key: "_other", value: "x" }]),
    ).toBeNull();
  });

  it("parses a USPS shipment from a pre-parsed array value", () => {
    const meta = [
      {
        key: "_wc_shipment_tracking_items",
        value: [
          {
            tracking_provider: "USPS",
            tracking_provider_name: "USPS",
            tracking_number: "9400 1112 0000 0000 0000 00",
            date_shipped: "2026-04-30",
          },
        ],
      },
    ];
    const s = parseTrackingFromMetaData(meta);
    expect(s).not.toBeNull();
    expect(s?.carrier).toBe("usps");
    expect(s?.carrierName).toBe("USPS");
    expect(s?.trackingNumber).toBe("9400 1112 0000 0000 0000 00");
    expect(s?.trackingUrl).toContain("tools.usps.com");
    expect(s?.shippedAt).toMatch(/^2026-04-30T/);
  });

  it("parses a JSON-stringified value (legacy plugin path)", () => {
    const meta = [
      {
        key: "_wc_shipment_tracking_items",
        value: JSON.stringify([
          {
            tracking_provider: "ups",
            tracking_number: "1Z999AA10123456784",
            date_shipped: 1714492800, // unix seconds
          },
        ]),
      },
    ];
    const s = parseTrackingFromMetaData(meta);
    expect(s?.carrier).toBe("ups");
    expect(s?.trackingUrl).toContain("ups.com/track");
    // unix epoch should be converted to ISO
    expect(s?.shippedAt).toMatch(/^2024-04-30T/);
  });

  it("prefers a custom_tracking_link over the carrier template", () => {
    const meta = [
      {
        key: "_wc_shipment_tracking_items",
        value: [
          {
            custom_tracking_provider: "Local Courier",
            custom_tracking_link: "https://courier.example.com/?ref=ABC",
            tracking_number: "ABC",
            date_shipped: "2026-04-30",
          },
        ],
      },
    ];
    const s = parseTrackingFromMetaData(meta);
    expect(s?.trackingUrl).toBe("https://courier.example.com/?ref=ABC");
  });

  it("rejects a malicious javascript: custom link", () => {
    const meta = [
      {
        key: "_wc_shipment_tracking_items",
        value: [
          {
            tracking_provider: "USPS",
            custom_tracking_link: "javascript:alert(1)",
            tracking_number: "9400",
            date_shipped: "2026-04-30",
          },
        ],
      },
    ];
    const s = parseTrackingFromMetaData(meta);
    // Falls back to carrier template, not the malicious href.
    expect(s?.trackingUrl).toContain("usps.com");
  });

  it("picks the most-recent shipment when several are present", () => {
    const meta = [
      {
        key: "_wc_shipment_tracking_items",
        value: [
          {
            tracking_provider: "USPS",
            tracking_number: "OLD",
            date_shipped: "2026-04-01",
          },
          {
            tracking_provider: "FedEx",
            tracking_number: "NEW",
            date_shipped: "2026-04-30",
          },
        ],
      },
    ];
    const s = parseTrackingFromMetaData(meta);
    expect(s?.trackingNumber).toBe("NEW");
    expect(s?.carrier).toBe("fedex");
    expect(s?.trackingUrl).toContain("fedex.com");
  });

  it("skips entries with no tracking number and falls back to the next", () => {
    const meta = [
      {
        key: "_wc_shipment_tracking_items",
        value: [
          { tracking_provider: "USPS", tracking_number: "", date_shipped: "2026-04-30" },
          { tracking_provider: "ups", tracking_number: "1Z", date_shipped: "2026-04-29" },
        ],
      },
    ];
    const s = parseTrackingFromMetaData(meta);
    expect(s?.trackingNumber).toBe("1Z");
    expect(s?.carrier).toBe("ups");
  });

  it("returns null when the value is malformed JSON", () => {
    const meta = [{ key: "_wc_shipment_tracking_items", value: "not-json{" }];
    expect(parseTrackingFromMetaData(meta)).toBeNull();
  });

  it("uses 'other' carrier when neither standard nor custom provider supplied", () => {
    const meta = [
      {
        key: "_wc_shipment_tracking_items",
        value: [{ tracking_number: "X1", date_shipped: "2026-04-30" }],
      },
    ];
    const s = parseTrackingFromMetaData(meta);
    expect(s?.carrier).toBe("other");
    expect(s?.trackingUrl).toBe(""); // no template for 'other'
  });
});

describe("buildCarrierTrackingUrl", () => {
  it("returns the custom link when http(s)", () => {
    expect(
      buildCarrierTrackingUrl("usps", "X", "https://example.com/track"),
    ).toBe("https://example.com/track");
  });

  it("rejects non-http custom links", () => {
    expect(buildCarrierTrackingUrl("usps", "X", "javascript:1")).toContain(
      "usps.com",
    );
  });

  it("URL-encodes the tracking number", () => {
    const url = buildCarrierTrackingUrl("usps", "9400 1112 0000");
    expect(url).toContain("9400%201112%200000");
  });

  it("returns empty for unknown carriers", () => {
    expect(buildCarrierTrackingUrl("smartpost", "X")).toBe("");
  });

  it("returns empty for empty tracking number", () => {
    expect(buildCarrierTrackingUrl("usps", "")).toBe("");
  });
});
