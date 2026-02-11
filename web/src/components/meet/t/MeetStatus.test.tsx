import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { vi } from "vitest";
import { MeetStatus } from "../MeetStatus";

vi.mock("../../../hooks/useFetchMeetStatuses", () => ({
  useMeetStatusLookup: () => ({
    getName: (id: number | null | undefined, fallback: string) => {
      if (id === 1) return "Draft";
      if (id === 2) return "Published";
      if (id === 3) return "Open";
      if (id === 4) return "Completed";
      if (id === 5) return "Cancelled";
      if (id === 6) return "Postponed";
      return fallback;
    },
  }),
}));

describe("MeetStatus", () => {
  it("renders fallback when no statusId", () => {
    render(<MeetStatus />);
    expect(screen.getByText("Scheduled")).toBeInTheDocument();
  });

  it("renders label for known status id 1", () => {
    render(<MeetStatus statusId={1} />);
    expect(screen.getByText("Draft")).toBeInTheDocument();
  });

  it("renders label for known status id 2", () => {
    render(<MeetStatus statusId={2} />);
    expect(screen.getByText("Published")).toBeInTheDocument();
  });

  it("renders label for known status id 3", () => {
    render(<MeetStatus statusId={3} />);
    expect(screen.getByText("Open")).toBeInTheDocument();
  });

  it("renders label for known status id 4", () => {
    render(<MeetStatus statusId={4} />);
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });

  it("renders label for known status id 5", () => {
    render(<MeetStatus statusId={5} />);
    expect(screen.getByText("Cancelled")).toBeInTheDocument();
  });

  it("renders label for known status id 6", () => {
    render(<MeetStatus statusId={6} />);
    expect(screen.getByText("Postponed")).toBeInTheDocument();
  });

  it("uses custom fallback when provided", () => {
    render(<MeetStatus statusId={999} fallbackLabel="Unknown" />);
    expect(screen.getByText("Unknown")).toBeInTheDocument();
  });
});
