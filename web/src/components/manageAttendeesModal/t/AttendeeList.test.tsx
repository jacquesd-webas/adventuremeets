import { fireEvent, render, screen } from "@testing-library/react";
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
  expect(screen.getByText("8")).toBeInTheDocument();
  expect(screen.getByText("2")).toBeInTheDocument();

  fireEvent.click(
    screen.getByRole("button", { name: "Filter accepted attendees" }),
  );
  expect(screen.getByText("Confirmed")).toBeInTheDocument();
  expect(screen.getByText("Checked in")).toBeInTheDocument();
  expect(screen.getByText("Attended")).toBeInTheDocument();
  expect(screen.queryByText("Rejected")).not.toBeInTheDocument();
  expect(screen.queryByText("Waitlisted")).not.toBeInTheDocument();

  fireEvent.click(
    screen.getByRole("button", { name: "Filter rejected attendees" }),
  );
  expect(screen.getByText("Rejected")).toBeInTheDocument();
  expect(screen.getByText("Cancelled")).toBeInTheDocument();
  expect(screen.queryByText("Confirmed")).not.toBeInTheDocument();

  fireEvent.click(
    screen.getByRole("button", { name: "Filter waitlisted attendees" }),
  );
  expect(screen.getByText("Waitlisted")).toBeInTheDocument();
  expect(screen.queryByText("Rejected")).not.toBeInTheDocument();

  fireEvent.click(
    screen.getByRole("button", { name: "Filter waitlisted attendees" }),
  );
  expect(screen.getByText("Confirmed")).toBeInTheDocument();
  expect(screen.getByText("Rejected")).toBeInTheDocument();
});

it("opens search below the counters, filters attendees, and clears the filter", () => {
  const attendees = [
    {
      id: "alex",
      name: "Alex Rider",
      email: "alex@example.com",
      status: AttendeeStatusEnum.Confirmed,
      guests: 0,
    },
    {
      id: "sam",
      name: "Sam Walker",
      email: "sam@example.com",
      status: AttendeeStatusEnum.Confirmed,
      guests: 0,
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

  expect(
    screen.queryByRole("textbox", { name: "Search attendees" }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Search attendees" }));
  const search = screen.getByRole("textbox", { name: "Search attendees" });
  fireEvent.change(search, { target: { value: "sam@example.com" } });

  expect(screen.getByText("Sam Walker")).toBeInTheDocument();
  expect(screen.queryByText("Alex Rider")).not.toBeInTheDocument();
  expect(screen.getByText("2")).toBeInTheDocument();

  fireEvent.click(
    screen.getByRole("button", { name: "Filter rejected attendees" }),
  );
  expect(
    screen.getByText("No attendees match your filters."),
  ).toBeInTheDocument();

  fireEvent.click(
    screen.getByRole("button", { name: "Clear attendee filters" }),
  );
  expect(
    screen.queryByRole("textbox", { name: "Search attendees" }),
  ).not.toBeInTheDocument();
  expect(screen.getByText("Alex Rider")).toBeInTheDocument();
  expect(screen.getByText("Sam Walker")).toBeInTheDocument();
});
