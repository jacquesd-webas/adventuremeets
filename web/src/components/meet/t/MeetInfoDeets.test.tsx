import { fireEvent, render, screen } from "@testing-library/react";
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
});
