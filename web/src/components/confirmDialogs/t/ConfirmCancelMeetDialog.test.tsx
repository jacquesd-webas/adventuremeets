import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfirmCancelMeetDialog } from "../ConfirmCancelMeetDialog";

describe("ConfirmCancelMeetDialog", () => {
  it("renders copy and triggers confirm/close", () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ConfirmCancelMeetDialog open onConfirm={onConfirm} onClose={onClose} />
      </QueryClientProvider>,
    );

    expect(screen.getAllByText(/Cancel meet/i).length).toBeGreaterThan(0);
    expect(
      screen.getByText(/Cancelling will prevent any new submissions/i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getAllByText(/Cancel meet/i)[0]);
    fireEvent.click(screen.getAllByRole("button", { name: /Cancel meet/i })[0]);
    fireEvent.click(screen.getByRole("button", { name: /^Cancel$/i }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
