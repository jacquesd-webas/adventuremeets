import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import ListPage from "../ListPage";

const mockSetMobileHeaderAction = vi.fn();
const mockSetListPageView = vi.fn();

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

vi.mock("@mui/x-data-grid", () => ({
  DataGrid: ({ rows, onRowClick }: any) => (
    <button type="button" onClick={() => onRowClick?.({ row: rows[0] })}>
      Select meet
    </button>
  ),
}));

vi.mock("../../hooks/useFetchMeets", () => ({
  useFetchMeets: () => ({
    data: [mockMeet],
    total: 1,
    isLoading: false,
  }),
}));

vi.mock("../../hooks/useFetchMeet", () => ({
  useFetchMeet: () => ({
    data: null,
    isLoading: false,
  }),
}));

vi.mock("../../context/organizationContext", () => ({
  useCurrentOrganization: () => ({
    currentOrganizationId: "org-1",
    currentOrganizationRole: "organizer",
  }),
}));

vi.mock("../../context/authContext", () => ({
  useAuth: () => ({
    user: { id: "organizer-1" },
  }),
}));

vi.mock("../../context/filterContext", () => ({
  useFilters: () => ({
    listPageView: "all",
    setListPageView: mockSetListPageView,
  }),
}));

vi.mock("../../components/Heading", () => ({
  Heading: ({ title }: any) => <div>{title}</div>,
}));

vi.mock("../../components/meet/MeetStatus", () => ({
  MeetStatus: () => <div>Status</div>,
}));

vi.mock("../../components/meet/MeetActionsMenu", () => ({
  MeetActionsMenu: () => <div>Menu</div>,
}));

vi.mock("../../components/meet/MeetFilterButtonGroup", () => ({
  MeetFilterButtonGroup: () => <div>Filters</div>,
}));

vi.mock("../../components/meet/MeetSearchField", () => ({
  MeetSearchField: () => <div>Search</div>,
}));

vi.mock("../../components/meet/MeetActionsDialogs", () => ({
  MeetActionsDialogs: (props: any) => (
    <pre data-testid="meet-actions-dialogs-props">
      {JSON.stringify(props, null, 2)}
    </pre>
  ),
}));

describe("ListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes isOrganizer to the actions dialogs for the selected organizer-owned meet", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <ListPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Select meet" }));

    expect(screen.getByTestId("meet-actions-dialogs-props")).toHaveTextContent(
      '"isOrganizer": true',
    );
    expect(screen.getByTestId("meet-actions-dialogs-props")).toHaveTextContent(
      '"canManageMeet": true',
    );
  });
});
