import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmailDeliveryStatus } from "../EmailDeliveryStatus";

describe("EmailDeliveryStatus", () => {
  it.each([
    ["sent", "Sent", "CheckCircleOutlineIcon"],
    ["opened", "Opened", "CheckCircleOutlineIcon"],
    ["bounced", "Bounced", "CancelOutlinedIcon"],
    ["failed", "Failed to send", "CancelOutlinedIcon"],
  ] as const)("shows the %s icon", (status, label, icon) => {
    render(<EmailDeliveryStatus status={status} />);
    expect(screen.getByRole("img", { name: label })).toHaveAttribute("data-testid", icon);
  });

  it.each([null, "pending"] as const)("does not label %s as sent", (status) => {
    const { container } = render(<EmailDeliveryStatus status={status} />);
    expect(container).toBeEmptyDOMElement();
  });
});
