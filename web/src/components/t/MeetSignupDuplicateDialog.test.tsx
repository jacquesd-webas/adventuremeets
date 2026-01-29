import { render, screen, fireEvent } from "@testing-library/react";
import { MeetSignupDuplicateDialog } from "../meetSignup/MeetSignupDuplicateDialog";

describe("MeetSignupDuplicateDialog", () => {
  it("renders copy and closes", () => {
    const onClose = vi.fn();
    render(
      <MeetSignupDuplicateDialog
        open
        onClose={onClose}
        onRemove={vi.fn()}
        onUpdate={vi.fn()}
      />
    );
    expect(screen.getAllByText(/Already signed up/i).length).toBeGreaterThan(0);
    expect(
      screen.getByText(/You have already signed up for this meet/i)
    ).toBeInTheDocument();
    fireEvent.click(screen.getByText("Close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
