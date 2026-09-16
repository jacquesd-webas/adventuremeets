import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { EmailDeliveryStatus } from "../EmailDeliveryStatus";

describe("EmailDeliveryStatus", () => {
  it.each([
    ["sent", "Sent", "CheckCircleOutlineIcon"],
    ["delivered", "Sent", "CheckCircleOutlineIcon"],
    ["opened", "Delivered", "CheckCircleOutlineIcon"],
    ["bounced", "Bounced", "CancelOutlinedIcon"],
    ["failed", "Failed to send", "CancelOutlinedIcon"],
  ] as const)("shows the %s icon", (status, label, icon) => {
    render(<EmailDeliveryStatus status={status} />);
    expect(screen.getByRole("img", { name: label })).toHaveAttribute(
      "data-testid",
      icon,
    );
  });

  it.each([
    ["sent", "Sent", "successfully been sent to the attendee"],
    ["delivered", "Sent", "successfully been sent to the attendee"],
    ["opened", "Delivered", "mail program has accessed the email"],
    ["bounced", "Bounced", "could not be delivered to the attendee"],
    ["failed", "Failed to send", "problem with the mail server"],
  ] as const)("explains the %s status", async (status, label, explanation) => {
    const user = userEvent.setup();
    render(<EmailDeliveryStatus status={status} />);

    await user.hover(screen.getByRole("img", { name: label }));

    expect(await screen.findByRole("tooltip")).toHaveTextContent(explanation);
  });

  it.each([null, "pending"] as const)("does not label %s as sent", (status) => {
    const { container } = render(<EmailDeliveryStatus status={status} />);
    expect(container).toBeEmptyDOMElement();
  });
});
