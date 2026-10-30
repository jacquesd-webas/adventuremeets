import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ConfirmIndemnityPage from "../ConfirmIndemnityPage";

const post = vi.fn();

vi.mock("../../hooks/useApi", () => ({
  useApi: () => ({ post }),
}));

vi.mock("../../hooks/useFetchMeetSignup", () => ({
  useFetchMeetSignup: () => ({
    data: { indemnity: "I accept the mountain activity waiver." },
    isLoading: false,
  }),
}));

describe("ConfirmIndemnityPage", () => {
  beforeEach(() => post.mockReset());

  it("shows the indemnity being confirmed", () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter
          initialEntries={[
            "/meets/share-123/attendee-1/confirm-indemnity?token=token-1",
          ]}
        >
          <Routes>
            <Route
              path="/meets/:code/:attendeeId/confirm-indemnity"
              element={<ConfirmIndemnityPage />}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(
      screen.getByText("I accept the mountain activity waiver."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Confirm indemnity acceptance" }),
    ).toBeEnabled();
  });

  it("asks the attendee to accept a resent indemnity before recording it", async () => {
    post.mockResolvedValue({ indemnityAccepted: true });
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter
          initialEntries={[
            "/meets/share-123/attendee-1/confirm-indemnity?token=token-1&request=1",
          ]}
        >
          <Routes>
            <Route
              path="/meets/:code/:attendeeId/confirm-indemnity"
              element={<ConfirmIndemnityPage />}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(
      screen.getByText("I accept the mountain activity waiver."),
    ).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole("button", { name: "I accept the indemnity" }),
    );

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith(
        "/meets/share-123/attendees/attendee-1/confirm-indemnity",
        { token: "token-1" },
      ),
    );
    expect(
      await screen.findByText("Your indemnity acceptance has been recorded."),
    ).toBeInTheDocument();
  });
});
