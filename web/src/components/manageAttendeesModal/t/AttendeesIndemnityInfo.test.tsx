import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AttendeesIndemnityInfo } from "../AttendeesIndemnityInfo";

const resendIndemnityConfirmationAsync = vi.fn();

vi.mock("../../../hooks/useResendIndemnityConfirmation", () => ({
  useResendIndemnityConfirmation: () => ({
    resendIndemnityConfirmationAsync,
    isResendingIndemnity: false,
  }),
}));

const baseProps = {
  attendeeId: "attendee-1",
  meetId: "meet-1",
  attendeeEmail: "walker@example.com",
  hasIndemnity: true,
  guests: 0,
  inviteDisabled: true,
  onGuestIncrement: vi.fn(),
  onGuestDecrement: vi.fn(),
  onInvite: vi.fn(),
};

const setMobileViewport = (matches: boolean) => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

describe("AttendeesIndemnityInfo", () => {
  beforeEach(() => {
    resendIndemnityConfirmationAsync.mockReset();
    setMobileViewport(false);
  });

  it("resends an outstanding indemnity confirmation", async () => {
    resendIndemnityConfirmationAsync.mockResolvedValue({ sent: true });
    render(
      <QueryClientProvider client={new QueryClient()}>
        <AttendeesIndemnityInfo
          {...baseProps}
          indemnityAccepted={false}
          needIndemnityConfirmationEmail
          indemnityAcceptance={{
            acceptedAt: "2026-09-30T10:00:00.000Z",
          }}
        />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Resend indemnity" }));

    await waitFor(() =>
      expect(resendIndemnityConfirmationAsync).toHaveBeenCalledWith({
        meetId: "meet-1",
        attendeeId: "attendee-1",
      }),
    );
  });

  it("shows the acceptance fingerprint and confirmation details", () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <AttendeesIndemnityInfo
          {...baseProps}
          indemnityAccepted
          needIndemnityConfirmationEmail
          indemnityAcceptance={{
            acceptedAt: "2026-09-30T10:00:00.000Z",
            confirmedAt: "2026-09-30T10:05:00.000Z",
            confirmationMethod: "email",
            acceptedByName: "Alex Walker",
            acceptanceIp: "203.0.113.10",
            acceptanceUserAgent: "Mobile Safari",
            indemnityTextHash: "abc123",
          }}
        />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Accepted" }));

    expect(screen.getByText("Acceptance fingerprint")).toBeInTheDocument();
    expect(screen.getByText("By: Alex Walker")).toBeInTheDocument();
    expect(screen.getByText("IP: 203.0.113.10")).toBeInTheDocument();
    expect(screen.getByText("Device: Mobile Safari")).toBeInTheDocument();
    expect(screen.getByText("Fingerprint: abc123")).toBeInTheDocument();
    expect(screen.getByText(/Confirmed by email:/)).toBeInTheDocument();
  });

  it("shows the acceptance fingerprint in a mobile drawer", () => {
    setMobileViewport(true);

    render(
      <QueryClientProvider client={new QueryClient()}>
        <AttendeesIndemnityInfo
          {...baseProps}
          indemnityAccepted
          indemnityAcceptance={{
            acceptedAt: "2026-09-30T10:00:00.000Z",
            acceptedByName: "Alex Walker",
          }}
        />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Accepted" }));

    expect(screen.getByRole("presentation")).toBeInTheDocument();
    expect(screen.getByText("Acceptance fingerprint")).toBeInTheDocument();
    expect(screen.getByText("By: Alex Walker")).toBeInTheDocument();
  });
});
