import { render, screen, fireEvent } from "@testing-library/react";
import { ConfirmDeleteMeetDialog } from "../ConfirmDeleteMeetDialog";

describe("ConfirmDeleteMeetDialog", () => {
  it("renders delete message and handles actions", () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(<ConfirmDeleteMeetDialog open onConfirm={onConfirm} onClose={onClose} />);

    expect(screen.getAllByText(/Delete meet\?/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Deleting a draft meet cannot be undone/i)).toBeInTheDocument();

    fireEvent.click(screen.getAllByText(/Delete meet/i)[0]);
    fireEvent.click(screen.getByRole("button", { name: /Delete/i }));
    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
