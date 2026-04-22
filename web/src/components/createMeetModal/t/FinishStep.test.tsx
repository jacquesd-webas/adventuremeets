import { fireEvent, render, screen } from "@testing-library/react";
import { FinishStep } from "../FinishStep";
import { initialState } from "../CreateMeetState";
import MeetStatusEnum from "../../../types/MeetStatusEnum";

describe("FinishStep", () => {
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
});
