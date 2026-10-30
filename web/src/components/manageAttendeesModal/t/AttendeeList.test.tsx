import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { AttendeeList } from "../AttendeeList";
import type { Attendee } from "../../../types/AttendeeModel";
import type { Meet } from "../../../types/MeetModel";
import AttendeeStatusEnum from "../../../types/AttendeeStatusEnum";

it("counts attendees and their guests using the meet card status groups", () => {
  const attendees = [
    {
      id: "confirmed",
      name: "Confirmed",
      status: AttendeeStatusEnum.Confirmed,
      guests: 1,
    },
    {
      id: "checked-in",
      name: "Checked in",
      status: AttendeeStatusEnum.CheckedIn,
      guests: 2,
    },
    {
      id: "attended",
      name: "Attended",
      status: AttendeeStatusEnum.Attended,
      guests: 0,
    },
    {
      id: "rejected",
      name: "Rejected",
      status: AttendeeStatusEnum.Rejected,
      guests: 2,
    },
    {
      id: "waitlisted",
      name: "Waitlisted",
      status: AttendeeStatusEnum.Waitlisted,
      guests: 1,
    },
    {
      id: "cancelled",
      name: "Cancelled",
      status: AttendeeStatusEnum.Cancelled,
      guests: 4,
    },
  ] as Attendee[];

  render(
    <AttendeeList
      attendees={attendees}
      isLoading={false}
      meet={{ id: "meet-1" } as Meet}
      selectedAttendeeId={null}
      setSelectedAttendeeId={vi.fn()}
    />,
  );

  expect(screen.getByText("6")).toBeInTheDocument();
  expect(screen.getByText("3")).toBeInTheDocument();
  expect(screen.getByText("2")).toBeInTheDocument();
});
