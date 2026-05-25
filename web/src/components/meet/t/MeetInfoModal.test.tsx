import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { MeetInfoModal } from "../MeetInfoModal";
import { MeetStatusEnum } from "../../../types/MeetStatusEnum";

vi.mock("../../../hooks/useFetchMeet", () => ({
  useFetchMeet: vi.fn(),
}));

vi.mock("../../../hooks/useFetchMeetWall", () => ({
  useFetchMeetWall: vi.fn(),
}));

vi.mock("../../../context/authContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../../../hooks/useNotistack", () => ({
  useNotistack: vi.fn(),
}));

vi.mock("../../wall/downloadFavouriteWallArchive", () => ({
  downloadFavouriteWallArchive: vi.fn(),
}));

vi.mock("../MeetInfoSummary", () => ({
  MeetInfoSummary: ({
    meet,
    actionSlot,
  }: {
    meet: { name: string };
    actionSlot?: ReactNode;
  }) => (
    <div>
      <div>{meet.name}</div>
      {actionSlot}
    </div>
  ),
}));

vi.mock("../MeetStatusAlert", () => ({
  MeetStatusAlert: () => <div>status alert</div>,
}));

vi.mock("../../wall/MeetWall", () => ({
  MeetWall: ({ meetId }: { meetId: string }) => <div>meet wall {meetId}</div>,
}));

import { useFetchMeet } from "../../../hooks/useFetchMeet";
import { useFetchMeetWall } from "../../../hooks/useFetchMeetWall";
import { useAuth } from "../../../context/authContext";
import { useNotistack } from "../../../hooks/useNotistack";
import { downloadFavouriteWallArchive } from "../../wall/downloadFavouriteWallArchive";

describe("MeetInfoModal", () => {
  const success = vi.fn();
  const error = vi.fn();

  beforeEach(() => {
    success.mockReset();
    error.mockReset();
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "user-1" },
      isLoading: false,
      isAuthenticated: true,
      meUpdatedAt: 0,
      refreshSession: vi.fn(),
      logout: vi.fn(),
    } as any);
    vi.mocked(useFetchMeetWall).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    vi.mocked(useNotistack).mockReturnValue({
      success,
      error,
      info: vi.fn(),
      warn: vi.fn(),
    });
    vi.mocked(downloadFavouriteWallArchive).mockReset();
  });

  it("renders the meet wall for completed meets", () => {
    vi.mocked(useFetchMeet).mockReturnValue({
      data: {
        id: "meet-1",
        name: "Completed Meet",
        statusId: MeetStatusEnum.Completed,
        organizationId: "org-1",
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <MeetInfoModal open meetId="meet-1" onClose={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByText("Completed Meet")).toBeInTheDocument();
    expect(screen.getByText("meet wall meet-1")).toBeInTheDocument();
    expect(screen.queryByText("status alert")).not.toBeInTheDocument();
  });

  it("renders the status alert for non-completed meets", () => {
    vi.mocked(useFetchMeet).mockReturnValue({
      data: {
        id: "meet-2",
        name: "Open Meet",
        statusId: MeetStatusEnum.Open,
        organizationId: "org-1",
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <MeetInfoModal open meetId="meet-2" onClose={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByText("status alert")).toBeInTheDocument();
    expect(screen.queryByText("meet wall meet-2")).not.toBeInTheDocument();
  });

  it("renders the meet wall for closed meets after the start time", () => {
    vi.mocked(useFetchMeet).mockReturnValue({
      data: {
        id: "meet-3",
        name: "Closed Meet",
        statusId: MeetStatusEnum.Closed,
        startTime: "2026-04-20T08:00:00.000Z",
        organizationId: "org-1",
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <MeetInfoModal open meetId="meet-3" onClose={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByText("meet wall meet-3")).toBeInTheDocument();
    expect(screen.queryByText("status alert")).not.toBeInTheDocument();
  });

  it("keeps the status alert for closed meets before the start time", () => {
    vi.mocked(useFetchMeet).mockReturnValue({
      data: {
        id: "meet-4",
        name: "Upcoming Closed Meet",
        statusId: MeetStatusEnum.Closed,
        startTime: "2099-04-20T08:00:00.000Z",
        organizationId: "org-1",
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <MeetInfoModal open meetId="meet-4" onClose={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByText("status alert")).toBeInTheDocument();
    expect(screen.queryByText("meet wall meet-4")).not.toBeInTheDocument();
  });

  it("shows the favourites download control next to the close action for admins", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "admin-1", organizations: { "org-1": "admin" } },
      isLoading: false,
      isAuthenticated: true,
      meUpdatedAt: 0,
      refreshSession: vi.fn(),
      logout: vi.fn(),
    } as any);
    vi.mocked(useFetchMeet).mockReturnValue({
      data: {
        id: "meet-5",
        name: "Completed Meet",
        statusId: MeetStatusEnum.Completed,
        organizationId: "org-1",
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    vi.mocked(useFetchMeetWall).mockReturnValue({
      data: [
        {
          id: "wall-post",
          meetId: "meet-5",
          comment: "Featured recap",
          favourite: 2,
          createdAt: "2026-04-29T08:00:00.000Z",
        },
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <MeetInfoModal open meetId="meet-5" onClose={vi.fn()} />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("button", { name: "Download favourites" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Close meet details" }),
    ).toBeInTheDocument();
  });

  it("routes admin favourite downloads through the archive helper from the modal header", async () => {
    const user = userEvent.setup();

    vi.mocked(useAuth).mockReturnValue({
      user: { id: "admin-1", organizations: { "org-1": "admin" } },
      isLoading: false,
      isAuthenticated: true,
      meUpdatedAt: 0,
      refreshSession: vi.fn(),
      logout: vi.fn(),
    } as any);
    vi.mocked(useFetchMeet).mockReturnValue({
      data: {
        id: "meet-6",
        name: "Sunrise Hike",
        statusId: MeetStatusEnum.Completed,
        organizationId: "org-1",
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    vi.mocked(useFetchMeetWall).mockReturnValue({
      data: [
        {
          id: "wall-post",
          meetId: "meet-6",
          comment: "Featured recap",
          favourite: 2,
          createdAt: "2026-04-29T08:00:00.000Z",
        },
        {
          id: "wall-photo",
          meetId: "meet-6",
          url: "https://cdn.example.com/photo.jpg",
          authorName: "Alice",
          favourite: 1,
          createdAt: "2026-04-29T07:59:00.000Z",
        },
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <MeetInfoModal open meetId="meet-6" onClose={vi.fn()} />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Download favourites" }));

    expect(downloadFavouriteWallArchive).toHaveBeenCalledWith({
      meetName: "Sunrise Hike",
      favouritePost: expect.objectContaining({ id: "wall-post" }),
      favouritePhotos: [expect.objectContaining({ id: "wall-photo" })],
    });
  });
});
