import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import DashboardPage from "../DashboardPage";

const mockSetMobileHeaderAction = vi.fn();
const mockSetDashboardView = vi.fn();
const mockMeet = {
  id: "meet-1",
  name: "Sunrise Hike",
  organizerId: "organizer-1",
  statusId: 3,
  startTime: "2026-06-01T08:00:00.000Z",
  location: "Trailhead",
  shareCode: "share-123",
};

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );
  return {
    ...actual,
    useOutletContext: () => ({
      setMobileHeaderAction: mockSetMobileHeaderAction,
    }),
  };
});

vi.mock("../../hooks/useInfiniteFetchMeets", () => ({
  useInfiniteFetchMeets: () => ({
    data: [mockMeet],
    hasNextPage: false,
    fetchNextPage: vi.fn(),
    isLoading: false,
    isFetchingNextPage: false,
  }),
}));

vi.mock("../../hooks/useFetchMeetStatuses", () => ({
  useMeetStatusLookup: () => ({
    getName: () => "Scheduled",
  }),
}));

vi.mock("../../context/organizationContext", () => ({
  useCurrentOrganization: () => ({
    currentOrganizationId: "org-1",
    currentOrganizationRole: "member",
  }),
}));

vi.mock("../../context/authContext", () => ({
  useAuth: () => ({
    user: { id: "member-1" },
  }),
}));

vi.mock("../../context/filterContext", () => ({
  useFilters: () => ({
    dashboardView: "all",
    setDashboardView: mockSetDashboardView,
  }),
}));

vi.mock("../../components/Heading", () => ({
  Heading: ({ title }: any) => <div>{title}</div>,
}));

vi.mock("../../components/meet/MeetSearchField", () => ({
  MeetSearchField: () => <div>Search</div>,
}));

vi.mock("../../components/auth/CreatePrivateOrganizationDialog", () => ({
  CreatePrivateOrganizationDialog: ({ open }: any) => (
    <div data-testid="create-org-dialog">{String(open)}</div>
  ),
}));

vi.mock("../../components/dashboard/MeetColumn", () => ({
  MeetColumn: ({ setSelectedMeetId, setPendingAction }: any) => (
    <button
      type="button"
      onClick={() => {
        setSelectedMeetId("meet-1");
        setPendingAction("details");
      }}
    >
      Select meet
    </button>
  ),
}));

vi.mock("../../components/meet/MeetActionsDialogs", () => ({
  MeetActionsDialogs: (props: any) => (
    <pre data-testid="meet-actions-dialogs-props">
      {JSON.stringify(props, null, 2)}
    </pre>
  ),
}));

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders meet actions dialogs for member users and passes details actions through", async () => {
    const user = userEvent.setup();

    render(<DashboardPage />);

    await user.click(screen.getAllByRole("button", { name: "Select meet" })[0]);

    await waitFor(() => {
      expect(
        screen.getByTestId("meet-actions-dialogs-props"),
      ).toHaveTextContent('"pendingAction": "details"');
      expect(
        screen.getByTestId("meet-actions-dialogs-props"),
      ).toHaveTextContent('"canViewMeet": true');
      expect(
        screen.getByTestId("meet-actions-dialogs-props"),
      ).toHaveTextContent('"canManageMeet": false');
    });
  });
});
