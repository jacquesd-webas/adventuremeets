import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfirmDeleteMeetDialog } from "../ConfirmDeleteMeetDialog";

const deleteMeetAsync = vi.fn();

vi.mock("../../../hooks/useDeleteMeet", () => ({
  useDeleteMeet: () => ({ deleteMeetAsync, isLoading: false }),
}));

describe("ConfirmDeleteMeetDialog", () => {
  it("renders delete message and handles actions", async () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    const queryClient = new QueryClient();

    deleteMeetAsync.mockResolvedValue({ deleted: true });

    render(
      <QueryClientProvider client={queryClient}>
        <ConfirmDeleteMeetDialog
          open
          meetId="meet-1"
          onConfirm={onConfirm}
          onClose={onClose}
        />
      </QueryClientProvider>
    );

    expect(screen.getAllByText(/Delete meet\?/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Deleting a draft meet cannot be undone/i)).toBeInTheDocument();

    fireEvent.click(screen.getAllByText(/Delete meet/i)[0]);
    fireEvent.click(screen.getByRole("button", { name: /Delete/i }));
    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));

    await waitFor(() => {
      expect(deleteMeetAsync).toHaveBeenCalledWith({ meetId: "meet-1" });
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
