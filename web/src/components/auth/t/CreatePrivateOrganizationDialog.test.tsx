import { fireEvent, render, screen } from "@testing-library/react";
import { CreatePrivateOrganizationDialog } from "../CreatePrivateOrganizationDialog";

describe("CreatePrivateOrganizationDialog", () => {
  it("renders copy and handles cancel", () => {
    const onClose = vi.fn();
    render(<CreatePrivateOrganizationDialog open onClose={onClose} />);

    expect(
      screen.getByText("Create a private organisation")
    ).toBeInTheDocument();
    expect(
      screen.getByText(/This functionality is coming soon/i)
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("keeps create action disabled", () => {
    render(<CreatePrivateOrganizationDialog open onClose={vi.fn()} />);
    expect(
      screen.getByRole("button", { name: /Create private organisation/i })
    ).toBeDisabled();
  });
});
