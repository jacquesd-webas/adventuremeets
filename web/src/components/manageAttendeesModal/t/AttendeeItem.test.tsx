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
  });
});
