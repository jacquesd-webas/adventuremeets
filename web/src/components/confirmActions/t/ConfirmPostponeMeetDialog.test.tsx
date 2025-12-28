import { render, screen, fireEvent } from "@testing-library/react";
import { ConfirmPostponeMeetDialog } from "../ConfirmPostponeMeetDialog";

describe("ConfirmPostponeMeetDialog", () => {
  it("renders message field and passes trimmed text on confirm", () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(<ConfirmPostponeMeetDialog open onConfirm={onConfirm} onClose={onClose} />);

    const messageField = screen.getByLabelText(/Message to participants/i);
    fireEvent.change(messageField, { target: { value: "  Delayed due to weather  " } });

    fireEvent.click(screen.getByRole("button", { name: /^Postpone$/i }));
    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));

    expect(onConfirm).toHaveBeenCalledWith("Delayed due to weather");
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
