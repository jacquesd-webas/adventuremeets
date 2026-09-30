import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ConfirmIndemnityPage from "../ConfirmIndemnityPage";

vi.mock("../../hooks/useApi", () => ({
  useApi: () => ({ post: vi.fn() }),
}));

vi.mock("../../hooks/useFetchMeetSignup", () => ({
  useFetchMeetSignup: () => ({
    data: { indemnity: "I accept the mountain activity waiver." },
    isLoading: false,
  }),
}));

describe("ConfirmIndemnityPage", () => {
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
});
