import { render, screen } from "@testing-library/react";
import { AttendeeCheckinItem } from "../AttendeeCheckinItem";

describe("AttendeeCheckinItem", () => {
  it("shows the checked icon instead of the spinner when a checked-in row is still syncing", () => {
    const { container } = render(
      <AttendeeCheckinItem
        attendee={{
          id: "attendee-1",
          name: "Alex Example",
          email: "alex@example.com",
          phone: "",
        }}
        isCheckingIn
        isChecked
        syncState="queued"
        showDivider={false}
        onCheckin={vi.fn()}
        onUndo={vi.fn()}
      />,
    );

    expect(screen.getByText("Pending sync")).toBeInTheDocument();
    expect(
      container.querySelector('svg[data-testid="CheckBoxIcon"]'),
    ).toBeTruthy();
    expect(container.querySelector(".MuiCircularProgress-root")).toBeNull();
  });
});
