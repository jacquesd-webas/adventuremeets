import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreateMeetModal } from "../CreateMeetModal";
import { mapMeetToState } from "../CreateMeetState";

const mockSave = vi.fn(async () => ({}));

const meetFixture = {
  id: "meet-1",
  name: "Camping Meet",
  description: "Weekend campout",
  organizerId: "organizer-1",
  location: "Old Cave",
  locationLat: 10.1234567,
  locationLong: 20.7654321,
  startTime: "2026-02-12T06:00:00.000Z",
  endTime: "2026-02-13T22:00:00.000Z",
  openingDate: "2026-02-05T10:00:00.000Z",
  closingDate: "2026-02-11T18:00:00.000Z",
  capacity: 42,
  waitlistSize: 10,
  autoPlacement: true,
  autoPromoteWaitlist: true,
  allowGuests: true,
  maxGuests: 2,
  statusId: 1,
  metaDefinitions: [],
};

vi.mock("../../../hooks/useApi", () => ({
  useApi: () => ({ baseUrl: "http://localhost:3000" }),
}));

vi.mock("../../../hooks/useSaveMeet", () => ({
  useSaveMeet: () => ({ save: mockSave }),
}));

vi.mock("../../../hooks/useUpdateMeetStatus", () => ({
  useUpdateMeetStatus: () => ({
    updateStatusAsync: vi.fn(),
    isLoading: false,
  }),
}));

vi.mock("../../../hooks/useFetchMeet", () => ({
  useFetchMeet: () => ({
    data: meetFixture,
    isLoading: false,
  }),
}));

vi.mock("../../../hooks/useFetchOrganizers", () => ({
  useFetchOrganizers: () => ({
    data: [{ id: "organizer-1", firstName: "Alice", lastName: "Jones" }],
  }),
}));

vi.mock("../../../context/authContext", () => ({
  useAuth: () => ({
    user: { id: "organizer-1", firstName: "Alice", lastName: "Jones" },
  }),
}));

vi.mock("../../../context/organizationContext", () => ({
  useCurrentOrganization: () => ({
    currentOrganizationId: "org-1",
  }),
}));

describe("CreateMeetModal edit mode", () => {
  beforeEach(() => {
    mockSave.mockClear();
  });

  it("prefills fields from fetched meet across steps", async () => {
    const expected = mapMeetToState(meetFixture);
    const user = userEvent.setup();

    render(
      <CreateMeetModal open onClose={vi.fn()} onCreated={vi.fn()} meetId="meet-1" />
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Give your meet a name")).toHaveValue(
        expected.name
      );
    });

    expect(
      screen.getByPlaceholderText("Describe your meet in detail here")
    ).toHaveValue(expected.description);

    await user.click(screen.getByRole("button", { name: "Save & Continue" }));

    expect(
      screen.getByPlaceholderText(
        /Where is the meeting place\?/i
      )
    ).toHaveValue(expected.location);

    expect(screen.getByDisplayValue(expected.startTime)).toBeInTheDocument();
    expect(screen.getByDisplayValue(expected.endTime)).toBeInTheDocument();

    await user.click(screen.getByText("Limits"));

    expect(screen.getByDisplayValue(expected.openingDate)).toBeInTheDocument();
    expect(screen.getByDisplayValue(expected.closingDate)).toBeInTheDocument();
    expect(screen.getByDisplayValue(String(expected.capacity))).toBeInTheDocument();
    expect(
      screen.getByDisplayValue(String(expected.waitlistSize))
    ).toBeInTheDocument();
  });
});
