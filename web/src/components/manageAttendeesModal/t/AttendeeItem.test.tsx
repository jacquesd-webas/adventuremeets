import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { AttendeeItem } from "../AttendeeItem";
import AttendeeStatusEnum from "../../../types/AttendeeStatusEnum";

describe("AttendeeItem", () => {
  it("shows a question mark for invited attendees", () => {
    render(
      <AttendeeItem
        attendee={{
          id: "a1",
          status: AttendeeStatusEnum.Invited,
        }}
        label="Alex"
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByText("Alex")).toBeInTheDocument();
    expect(screen.getByText("?")).toBeInTheDocument();
    expect(screen.getByText("Invited")).toBeInTheDocument();
  });

  it("renders a darker avatar background for notified invited attendees", () => {
    render(
      <AttendeeItem
        attendee={{
          id: "a1",
          status: AttendeeStatusEnum.Invited,
          respondedAt: "2026-06-01T10:00:00.000Z",
        }}
        label="Alex"
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByText("?").closest(".MuiAvatar-root")).toHaveStyle({
      backgroundColor: "rgb(189, 189, 189)",
    });
  });
});
