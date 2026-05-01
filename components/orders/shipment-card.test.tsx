import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ShipmentCard } from "./shipment-card";
import type { Shipment } from "@/lib/checkout/shipment";

const baseShipment: Shipment = {
  trackingNumber: "9400111899223197428490",
  carrier: "usps",
  carrierName: "USPS",
  trackingUrl:
    "https://tools.usps.com/go/TrackConfirmAction?qtc_tLabels1=9400111899223197428490",
  shippedAt: "2026-04-30T18:00:00.000Z",
};

describe("ShipmentCard", () => {
  it("renders carrier, tracking number, and a tracking link when shipment is present", () => {
    render(<ShipmentCard shipment={baseShipment} orderStatus="processing" />);
    expect(screen.getByText("USPS")).toBeInTheDocument();
    expect(screen.getByText(baseShipment.trackingNumber)).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /track package/i });
    expect(link).toHaveAttribute("href", baseShipment.trackingUrl);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("omits the tracking link when no URL is available", () => {
    render(
      <ShipmentCard
        shipment={{ ...baseShipment, trackingUrl: "" }}
        orderStatus="processing"
      />,
    );
    expect(screen.queryByRole("link", { name: /track package/i })).toBeNull();
    expect(screen.getByText(baseShipment.trackingNumber)).toBeInTheDocument();
  });

  it("renders the 'tracking pending' placeholder when status is completed but no shipment", () => {
    render(<ShipmentCard shipment={null} orderStatus="completed" />);
    expect(screen.getByText(/tracking pending/i)).toBeInTheDocument();
  });

  it("renders nothing for pre-fulfilment statuses without a shipment", () => {
    const { container } = render(
      <ShipmentCard shipment={null} orderStatus="processing" />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing for cancelled / refunded / failed orders even with a shipment", () => {
    for (const status of ["cancelled", "refunded", "failed"]) {
      const { container, unmount } = render(
        <ShipmentCard shipment={baseShipment} orderStatus={status} />,
      );
      expect(container).toBeEmptyDOMElement();
      unmount();
    }
  });
});
