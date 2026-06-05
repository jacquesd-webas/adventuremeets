import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { CreateMeetModal } from "../CreateMeetModal";
import { mapMeetToState, toIsoWithOffset } from "../CreateMeetState";
import MeetStatusEnum from "../../../types/MeetStatusEnum";
import { EDITING_MEET_RESTORE_KEY } from "../createMeetPreviewRestore";

const mockSave = vi.fn(async () => ({}));
const mockUpdateStatusAsync = vi.fn(async () => ({}));
const navigate = vi.fn();

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
  allowSelfCheckin: true,
  allowWalkins: true,
  requireEmail: true,
  requirePhone: true,
  requireOrg1: false,
  requireOrg2: true,
  maxGuests: 2,
  statusId: 1,
  shareCode: "camping-share",
  metaDefinitions: [],
};

let currentMeetFixture = meetFixture;

function renderCreateMeetModal() {
  return render(
    <MemoryRouter initialEntries={["/plan"]}>
      <CreateMeetModal
        open
        onClose={vi.fn()}
        onCreated={vi.fn()}
        meetId="meet-1"
        isOrganizer
        canManageMeet
      />
    </MemoryRouter>,
  );
}

function renderCreateMeetModalAsAdmin() {
  return render(
    <MemoryRouter initialEntries={["/plan"]}>
      <CreateMeetModal
        open
        onClose={vi.fn()}
        onCreated={vi.fn()}
        meetId="meet-1"
        canManageMeet
      />
    </MemoryRouter>,
  );
}

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

vi.mock("../../../hooks/useApi", () => ({
  useApi: () => ({ baseUrl: "http://localhost:3000" }),
}));

vi.mock("../../../hooks/useSaveMeet", () => ({
  useSaveMeet: () => ({ save: mockSave }),
}));

vi.mock("../../../hooks/useUpdateMeetStatus", () => ({
  useUpdateMeetStatus: () => ({
    updateStatusAsync: mockUpdateStatusAsync,
    isLoading: false,
  }),
}));

vi.mock("../../../hooks/useFetchMeet", () => ({
  useFetchMeet: () => ({
    data: currentMeetFixture,
    isLoading: false,
  }),
}));

vi.mock("../../../hooks/useFetchOrganizationTemplates", () => ({
  useFetchOrganizationTemplates: () => ({
    data: [],
    isLoading: false,
    error: null,
  }),
}));

vi.mock("../../../hooks/useFetchOrganizationTemplate", () => ({
  useFetchOrganizationTemplate: () => ({
    data: null,
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
  const originalLocation = window.location;
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    mockSave.mockClear();
    mockUpdateStatusAsync.mockClear();
    navigate.mockClear();
    currentMeetFixture = meetFixture;
    window.sessionStorage.clear();
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
    window.matchMedia = originalMatchMedia;
  });

  it("prefills fields from fetched meet across steps", async () => {
    const expected = mapMeetToState(meetFixture);
    const user = userEvent.setup();

    renderCreateMeetModal();

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Give your meet a name")).toHaveValue(
        expected.name,
      );
    });

    expect(
      screen.getByPlaceholderText("Describe your meet in detail here"),
    ).toHaveValue(expected.description);

    await user.click(screen.getByRole("button", { name: "Save & Continue" }));

    expect(
      screen.getByPlaceholderText(/Where is the meeting place\?/i),
    ).toHaveValue(expected.location);

    expect(screen.getByDisplayValue(expected.startTime)).toBeInTheDocument();
    expect(screen.getByDisplayValue(expected.endTime)).toBeInTheDocument();

    await user.click(screen.getByText("Questions"));

    expect(
      screen.getByRole("checkbox", { name: "E-mail address" }),
    ).toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: "Phone number" }),
    ).toBeChecked();

    await user.click(screen.getByText("Limits"));

    expect(screen.getByDisplayValue(expected.openingDate)).toBeInTheDocument();
    expect(screen.getByDisplayValue(expected.closingDate)).toBeInTheDocument();
    expect(
      screen.getByDisplayValue(String(expected.capacity)),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue(String(expected.waitlistSize)),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: "Allow self check-in" }),
    ).toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: "Allow walk-ins" }),
    ).toBeChecked();
  });

  it("automatically enables self check-in when walk-ins are enabled", async () => {
    const user = userEvent.setup();
    currentMeetFixture = {
      ...meetFixture,
      allowSelfCheckin: false,
      allowWalkins: false,
    };

    renderCreateMeetModal();

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("Give your meet a name"),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByText("Limits"));
    await user.click(
      screen.getByRole("checkbox", { name: "Allow walk-ins" }),
    );

    expect(
      screen.getByRole("checkbox", { name: "Allow self check-in" }),
    ).toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: "Allow walk-ins" }),
    ).toBeChecked();

    await user.click(screen.getByRole("button", { name: "Save & Continue" }));

    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({
        allowSelfCheckin: true,
        allowWalkins: true,
      }),
      "meet-1",
    );
  });

  it("saves required attendee field flags from the questions step", async () => {
    const user = userEvent.setup();
    currentMeetFixture = {
      ...meetFixture,
      requireEmail: false,
      requirePhone: false,
      requireOrg1: false,
      requireOrg2: false,
    };

    renderCreateMeetModal();

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("Give your meet a name"),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByText("Questions"));
    await user.click(screen.getByRole("checkbox", { name: "E-mail address" }));
    await user.click(screen.getByRole("checkbox", { name: "Phone number" }));
    await user.click(screen.getByRole("button", { name: "Save & Continue" }));

    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({
        requireEmail: true,
        requirePhone: true,
        requireOrg1: false,
        requireOrg2: false,
      }),
      "meet-1",
    );
  });

  it("shows a lock for an org admin and lets them unlock the meet", async () => {
    currentMeetFixture = {
      ...meetFixture,
      organizerId: "someone-else",
    };
    const user = userEvent.setup();

    renderCreateMeetModalAsAdmin();

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("Give your meet a name"),
      ).toBeInTheDocument();
    });

    const saveAndContinue = screen.getByRole("button", {
      name: "Save & Continue",
    });
    expect(screen.getByLabelText("Unlock meet")).toBeInTheDocument();
    expect(saveAndContinue).toBeDisabled();

    await user.click(screen.getByLabelText("Unlock meet"));

    expect(screen.getByLabelText("Unlock meet")).toBeInTheDocument();
    expect(saveAndContinue).toBeEnabled();
  });

  it("passes reconfirmAttendees when saving a postponed meet", async () => {
    const user = userEvent.setup();
    currentMeetFixture = {
      ...meetFixture,
      statusId: MeetStatusEnum.Postponed,
    };

    renderCreateMeetModal();

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("Give your meet a name"),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByText("Finish"));
    await user.click(
      screen.getByRole("checkbox", {
        name: /require attendees to re-confirm their attendance/i,
      }),
    );
    await user.click(screen.getByRole("button", { name: /publish/i }));

    expect(mockUpdateStatusAsync).toHaveBeenCalledWith({
      meetId: "meet-1",
      statusId: MeetStatusEnum.Published,
      reconfirmAttendees: false,
    });
  });

  it("resets past opening and closing dates when publishing", async () => {
    const user = userEvent.setup();
    currentMeetFixture = {
      ...meetFixture,
      statusId: MeetStatusEnum.Postponed,
      openingDate: "2026-02-05T10:00:00.000Z",
      closingDate: "2026-02-11T18:00:00.000Z",
    };

    renderCreateMeetModal();

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("Give your meet a name"),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByText("Finish"));
    const beforePublish = Date.now();
    await user.click(screen.getByRole("button", { name: /publish/i }));
    const expectedClosingDate = toIsoWithOffset(
      mapMeetToState(currentMeetFixture).startTime,
    );

    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledWith(
        {
          closingDate: expectedClosingDate,
        },
        "meet-1",
      );
    });

    const openingDateCall = mockSave.mock.calls.find((call) => {
      const payload = call[0] as { openingDate?: string } | undefined;
      return typeof payload?.openingDate === "string";
    });
    expect(openingDateCall).toBeTruthy();
    const openingDate = (openingDateCall?.[0] as { openingDate: string })
      .openingDate;
    expect(typeof openingDate).toBe("string");
    expect(new Date(openingDate).getTime()).toBeGreaterThanOrEqual(
      beforePublish,
    );

    expect(mockUpdateStatusAsync).toHaveBeenCalledWith({
      meetId: "meet-1",
      statusId: MeetStatusEnum.Published,
      reconfirmAttendees: true,
    });
  });

  it("stores editor state and navigates in the same tab when previewing", async () => {
    const user = userEvent.setup();

    renderCreateMeetModal();

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("Give your meet a name"),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByText("Finish"));
    await user.click(screen.getByRole("button", { name: /preview/i }));

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith("/meets/camping-share?preview=true");
    });

    const snapshot = window.sessionStorage.getItem(EDITING_MEET_RESTORE_KEY);
    expect(snapshot).toContain('"meetId":"meet-1"');
  });

  it("leaves a minimal preview restore snapshot in session storage", async () => {
    window.sessionStorage.setItem(
      EDITING_MEET_RESTORE_KEY,
      JSON.stringify({
        meetId: "meet-1",
        isEditing: true,
      }),
    );

    renderCreateMeetModal();

    expect(
      await screen.findByPlaceholderText("Give your meet a name"),
    ).toBeInTheDocument();
    expect(window.sessionStorage.getItem(EDITING_MEET_RESTORE_KEY)).toBe(
      JSON.stringify({
        meetId: "meet-1",
        isEditing: true,
      }),
    );
  });

  it("shows the steps as a left drawer on mobile without replacing the content", async () => {
    const user = userEvent.setup();
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("max-width"),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as typeof window.matchMedia;

    renderCreateMeetModal();

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("Give your meet a name"),
      ).toBeInTheDocument();
    });

    expect(
      screen.queryByTestId("create-meet-steps-drawer"),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /show panel/i }));

    expect(screen.getByTestId("create-meet-steps-drawer")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Give your meet a name"),
    ).toBeInTheDocument();
  });
});
