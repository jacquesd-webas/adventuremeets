import { render, screen, fireEvent } from "@testing-library/react";
import { ConfirmOpenMeetDialog } from "../ConfirmOpenMeetDialog";

describe("ConfirmOpenMeetDialog", () => {
  it("renders open message and triggers actions", () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(<ConfirmOpenMeetDialog open onConfirm={onConfirm} onClose={onClose} />);

    expect(screen.getAllByText(/Open meet\?/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/allow participants to join/i)).toBeInTheDocument();

    fireEvent.click(screen.getAllByText(/Open meet/i)[0]);
    fireEvent.click(screen.getByRole("button", { name: /Open meet/i }));
    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
