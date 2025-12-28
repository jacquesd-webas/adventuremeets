import { render, screen, fireEvent } from "@testing-library/react";
import { ConfirmCloseMeetDialog } from "../ConfirmCloseMeetDialog";

describe("ConfirmCloseMeetDialog", () => {
  it("renders copy and triggers actions", () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(<ConfirmCloseMeetDialog open onConfirm={onConfirm} onClose={onClose} />);

    expect(screen.getAllByText(/Close meet\?/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Closing the meet will prevent/i)).toBeInTheDocument();

    fireEvent.click(screen.getAllByText(/Close meet/i)[0]);
    fireEvent.click(screen.getByRole("button", { name: /Close meet/i }));
    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
