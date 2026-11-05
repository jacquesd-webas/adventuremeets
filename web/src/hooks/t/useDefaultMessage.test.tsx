import { renderHook } from "@testing-library/react";
import { useDefaultMessage } from "../useDefaultMessage";
import AttendeeStatusEnum from "../../types/AttendeeStatusEnum";

describe("useDefaultMessage", () => {
  it("uses custom invitation wording and falls back when it is blank", () => {
    const { result, rerender } = renderHook(
      ({ invitationWording }) =>
        useDefaultMessage(AttendeeStatusEnum.Invited, {
          meetName: "Camp",
          invitationWording,
        }),
      { initialProps: { invitationWording: "Please join our camp." } },
    );

    expect(result.current).toEqual({
      subject: "Invitation: Camp",
      content: "Please join our camp.",
    });

    rerender({ invitationWording: "   " });
    expect(result.current.content).toBe(
      "You have been invited to join this meet. Please open your meet link to confirm or update your attendance.",
    );
  });

  it("provides a checked-in message", () => {
    const { result } = renderHook(() =>
      useDefaultMessage(AttendeeStatusEnum.CheckedIn, { meetName: "Camp" }),
    );

    expect(result.current).toEqual({
      subject: "Checked in: Camp",
      content: "You have been checked in for the meet.",
    });
  });
});
