import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { MeetInfoModal } from "../MeetInfoModal";
import { MeetStatusEnum } from "../../../types/MeetStatusEnum";

vi.mock("../../../hooks/useFetchMeet", () => ({
  useFetchMeet: vi.fn(),
}));

vi.mock("../MeetInfoSummary", () => ({
  MeetInfoSummary: ({ meet }: { meet: { name: string } }) => <div>{meet.name}</div>,
}));

vi.mock("../MeetStatusAlert", () => ({
  MeetStatusAlert: () => <div>status alert</div>,
}));

vi.mock("../../wall/MeetWall", () => ({
  MeetWall: ({ meetId }: { meetId: string }) => <div>meet wall {meetId}</div>,
}));

import { useFetchMeet } from "../../../hooks/useFetchMeet";

describe("MeetInfoModal", () => {
  it("renders the meet wall for completed meets", () => {
    vi.mocked(useFetchMeet).mockReturnValue({
      data: {
        id: "meet-1",
        name: "Completed Meet",
        statusId: MeetStatusEnum.Completed,
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
});
