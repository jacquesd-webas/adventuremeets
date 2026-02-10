import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfirmCloseMeetDialog } from "../ConfirmCloseMeetDialog";

vi.mock("../../../hooks/useUpdateMeetStatus", () => ({
  useUpdateMeetStatus: () => ({ updateStatusAsync: vi.fn(), isLoading: false }),
}));

describe("ConfirmCloseMeetDialog", () => {
  it("renders copy and triggers actions", () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ConfirmCloseMeetDialog
          open
          meetId="123"
          onConfirm={onConfirm}
          onClose={onClose}
        />
      </QueryClientProvider>,
    );

    expect(screen.getAllByText(/Close meet\?/i).length).toBeGreaterThan(0);
    expect(
      screen.getByText(/Closing the meet will prevent any new submissions/i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Close meet/i }));
    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
