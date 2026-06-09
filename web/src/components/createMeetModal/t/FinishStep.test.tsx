import { fireEvent, render, screen } from "@testing-library/react";
import { FinishStep } from "../FinishStep";
import { initialState } from "../CreateMeetState";
import MeetStatusEnum from "../../../types/MeetStatusEnum";
import { openMeetPosterPrintWindow } from "../openMeetPosterPrintWindow";

vi.mock("../openMeetPosterPrintWindow", () => ({
  openMeetPosterPrintWindow: vi.fn(),
}));

describe("FinishStep", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows the postponed warning and toggles the reconfirm checkbox in edit mode", () => {
    const setState = vi.fn();

    render(
      <FinishStep
        state={{
          ...initialState,
          statusId: MeetStatusEnum.Postponed,
          attendeeReconfirm: true,
        }}
        setState={setState}
        errors={[]}
        shareCode="share-code-1"
        isEditing
      />,
    );

    expect(
      screen.getByText(
        "The meet was postponed. All attendees should re-confirm, unless you choose to keep their current status as is.",
      ),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("checkbox", {
        name: /require attendees to re-confirm their attendance/i,
      }),
    );

    expect(setState).toHaveBeenCalledTimes(1);
    const updater = setState.mock.calls[0][0];
    expect(
      updater({
        ...initialState,
        statusId: MeetStatusEnum.Postponed,
        attendeeReconfirm: true,
      }),
    ).toMatchObject({
      attendeeReconfirm: false,
    });
  });

  it("does not show the postponed warning for non-edit flow", () => {
    render(
      <FinishStep
        state={{
          ...initialState,
          statusId: MeetStatusEnum.Postponed,
        }}
        setState={vi.fn()}
        errors={[]}
        shareCode="share-code-1"
      />,
    );

    expect(
      screen.queryByText(/the meet was postponed/i),
    ).not.toBeInTheDocument();
  });

  it("calls onPreview for preview", () => {
    const onPreview = vi.fn();

    render(
      <FinishStep
        state={initialState}
        setState={vi.fn()}
        errors={[]}
        shareCode="share-code-1"
        onPreview={onPreview}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /preview/i }));

    expect(onPreview).toHaveBeenCalledTimes(1);
  });

  it("prints the signup poster with the meet signup URL", () => {
    render(
      <FinishStep
        state={{
          ...initialState,
          name: "Poster Meet",
          startTime: "2026-06-12T08:00",
          endTime: "2026-06-12T12:00",
          imagePreview: "https://example.com/poster.jpg",
        }}
        setState={vi.fn()}
        errors={[]}
        shareCode="share-code-1"
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /sign-up poster/i }),
    );

    expect(openMeetPosterPrintWindow).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Poster Meet",
        qrUrl: `${window.location.origin}/meets/share-code-1`,
        imageUrl: "https://example.com/poster.jpg",
        footerLabel: "Meet signup",
      }),
    );
  });

  it("shows and prints the self check-in poster when self check-in is available", () => {
    render(
      <FinishStep
        state={{
          ...initialState,
          name: "Poster Meet",
          startTime: "2026-06-12T08:00",
          endTime: "2026-06-12T12:00",
          allowSelfCheckin: true,
        }}
        setState={vi.fn()}
        errors={[]}
        shareCode="share-code-1"
        checkinPin="PIN123"
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /check-in poster/i }),
    );

    expect(openMeetPosterPrintWindow).toHaveBeenCalledWith(
      expect.objectContaining({
        qrUrl: `${window.location.origin}/meets/share-code-1/checkin?pin=PIN123`,
        footerLabel: "Self check-in",
      }),
    );
  });
});
