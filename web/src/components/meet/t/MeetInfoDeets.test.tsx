import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Meet from "../../../types/MeetModel";
import { MeetInfoDeets } from "../MeetInfoDeets";

const makeMeet = (overrides: Partial<Meet> = {}): Meet => ({
  id: "meet-1",
  name: "Camping Meet",
  organizerId: "org-1",
  organizerName: "Alice",
  location: "Old Cave",
  startTime: "2026-02-12T09:00:00.000Z",
  endTime: "2026-02-12T12:00:00.000Z",
  attendeeCount: 5,
  capacity: 10,
  currencySymbol: "$",
  costCents: 2000,
  ...overrides,
});

describe("MeetInfoDeets", () => {
  it("renders vertical details and opens map dialog from link-only location text", () => {
    const meet = makeMeet({ locationLat: 12.34, locationLong: 56.78 });
    render(<MeetInfoDeets meet={meet} />);

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("5 Applied (limit 10)")).toBeInTheDocument();
    expect(screen.getByText("$20.00")).toBeInTheDocument();

    const locationLink = screen.getByRole("button", { name: "Old Cave" });
    expect(locationLink).toBeInTheDocument();
    expect(screen.getByText(/at \d{1,2}:\d{2}/i)).toBeInTheDocument();

    fireEvent.click(locationLink);
    expect(screen.getByText("Location map")).toBeInTheDocument();
    const iframe = screen.getByTitle("Map");
    expect(iframe.getAttribute("src")).toContain("12.34%2C56.78");
  });

  it("renders horizontal layout and hides money row when cost is zero", () => {
    const meet = makeMeet({ costCents: 0 });
    const { container } = render(
      <MeetInfoDeets meet={meet} layout="horizontal" />,
    );

    expect(screen.getByText("5 Applied (limit 10)")).toBeInTheDocument();
    expect(screen.queryByText("$0.00")).not.toBeInTheDocument();

    const rootStack = container.querySelector(".MuiStack-root");
    expect(rootStack).toHaveStyle("flex-wrap: wrap");
  });

  it("shows applied count only when capacity is unlimited", () => {
    render(
      <MeetInfoDeets meet={makeMeet({ capacity: 0, attendeeCount: 17 })} />,
    );
    expect(screen.getByText("17 Applied")).toBeInTheDocument();
  });

  it("shows TBC location text when no location is provided", () => {
    render(<MeetInfoDeets meet={makeMeet({ location: "" })} />);
    expect(screen.getByText(/TBC/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /old cave/i }),
    ).not.toBeInTheDocument();
  });

  it("opens the mini attendee list from the attending count", async () => {
    const user = userEvent.setup();

    render(
      <MeetInfoDeets
        meet={makeMeet()}
        attendingAttendees={[
          { id: "attendee-1", name: "Alice Walker" },
          { id: "attendee-2", name: "Bob Smith" },
        ]}
      />,
    );

    expect(screen.getByText("2 Attending")).toBeInTheDocument();
    expect(screen.getByText("AW")).toBeInTheDocument();
    expect(screen.getByText("BS")).toBeInTheDocument();
    expect(screen.queryByText("5 Applied (limit 10)")).not.toBeInTheDocument();

    await user.click(screen.getByText("2 Attending"));

    expect(screen.getAllByText("Alice Walker")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Bob Smith")[0]).toBeInTheDocument();
  });

  it("caps the inline avatar preview for large attendee counts", () => {
    render(
      <MeetInfoDeets
        meet={makeMeet()}
        attendingAttendees={[
          { id: "attendee-1", name: "Alice Walker" },
          { id: "attendee-2", name: "Bob Smith" },
          { id: "attendee-3", name: "Chris Jones" },
          { id: "attendee-4", name: "Dana White" },
          { id: "attendee-5", name: "Evan Stone" },
          { id: "attendee-6", name: "Fiona Page" },
          { id: "attendee-7", name: "Gina Cross" },
          { id: "attendee-8", name: "Harry Cole" },
          { id: "attendee-9", name: "Iris Lane" },
          { id: "attendee-10", name: "Jake Moon" },
          { id: "attendee-11", name: "Kara Long" },
          { id: "attendee-12", name: "Liam Wood" },
          { id: "attendee-13", name: "Maya Reed" },
          { id: "attendee-14", name: "Noah Park" },
          { id: "attendee-15", name: "Olive Fox" },
          { id: "attendee-16", name: "Piper West" },
          { id: "attendee-17", name: "Quinn Dale" },
          { id: "attendee-18", name: "Ruby Hart" },
        ]}
      />,
    );

    expect(screen.getByText("18 Attending")).toBeInTheDocument();
    expect(screen.getByText("...9 more")).toBeInTheDocument();
  });
});
