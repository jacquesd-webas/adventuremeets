import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { vi } from "vitest";
import { ConfirmCompleteMeetDialog } from "../ConfirmCompleteMeetDialog";
import MeetStatusEnum from "../../../types/MeetStatusEnum";

const updateStatusAsync = vi.fn();

vi.mock("../../../hooks/useUpdateMeetStatus", () => ({
  useUpdateMeetStatus: () => ({ updateStatusAsync, isLoading: false }),
}));

describe("ConfirmCompleteMeetDialog", () => {
  beforeEach(() => {
    updateStatusAsync.mockReset();
    updateStatusAsync.mockResolvedValue(undefined);
  });

  it("marks the selected meet complete after confirmation", async () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmCompleteMeetDialog
        open
        meetId="meet-1"
        isOrganizer
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Complete meet" }));

    await waitFor(() => {
      expect(updateStatusAsync).toHaveBeenCalledWith({
        meetId: "meet-1",
        statusId: MeetStatusEnum.Completed,
      });
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });
  });
});
