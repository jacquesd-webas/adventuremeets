import { render, screen, fireEvent } from "@testing-library/react";
import { ConfirmActionDialog } from "../ConfirmActionDialog";

describe("ConfirmActionDialog", () => {
  it("renders dialog content and triggers callbacks", () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    render(
      <ConfirmActionDialog
        open
        title="Delete Item"
        description="Are you sure?"
        confirmLabel="Yes"
        cancelLabel="No"
        onConfirm={onConfirm}
        onClose={onClose}
      />
    );

    expect(screen.getByText("Delete Item")).toBeInTheDocument();
    expect(screen.getByText("Are you sure?")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "No" }));
    fireEvent.click(screen.getByRole("button", { name: "Yes" }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
