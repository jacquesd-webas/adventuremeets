import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MeetShare } from "../MeetShare";
import { openMeetPosterPrintWindow } from "../../createMeetModal/openMeetPosterPrintWindow";

const success = vi.fn();
const error = vi.fn();
vi.mock("../../../hooks/useNotistack", () => ({
  useNotistack: () => ({ success, error }),
}));
vi.mock("../../../hooks/useFetchOrganization", () => ({
  useFetchOrganization: () => ({
    data: { name: "Summit Explorers", logoUrl: "https://example.com/logo.png" },
  }),
}));
vi.mock("../../createMeetModal/openMeetPosterPrintWindow", () => ({
  openMeetPosterPrintWindow: vi.fn(),
}));
vi.mock("../MeetWhatsappComposer", () => ({
  MeetWhatsappComposer: () => <div>Composer opened</div>,
}));

const meet = {
  id: "meet-1",
  organizationId: "org-1",
  name: "Mountain walk",
  organizerId: "organizer-1",
  shareCode: "share-123",
  imageUrl: "https://example.com/mountain.jpg",
  location: "Table Mountain",
  costCents: 12500,
  currencySymbol: "R",
  organizerName: "Alex Walker",
  description: "A scenic walk.",
  startTime: "2026-11-01T08:00:00+02:00",
  endTime: "2026-11-01T12:00:00+02:00",
};

function setMobile(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: matches && query.includes("max-width"),
      media: query,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
}

describe("MeetShare", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setMobile(false);
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: undefined,
    });
  });

  it("offers share destinations, QR code, copy, and the existing poster", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    render(<MeetShare open onClose={vi.fn()} meet={meet} />);

    const url = `${window.location.origin}/share/share-123`;
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "QR Code" }).closest(".MuiCard-root"),
    ).toBeInTheDocument();
    expect(
      screen
        .getByRole("button", { name: "Copy Link" })
        .closest(".MuiCard-root"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Poster" }).closest(".MuiCard-root"),
    ).toBeInTheDocument();
    const whatsappText = new URL(
      screen.getByRole("link", { name: "WhatsApp" }).getAttribute("href")!,
    ).searchParams.get("text")!;
    const emailHref = screen
      .getByRole("link", { name: "Email" })
      .getAttribute("href")!;
    const emailText = decodeURIComponent(emailHref.split("&body=")[1]);
    expect(whatsappText).toContain("*Mountain walk*");
    expect(whatsappText).toContain("R125.00");
    expect(emailText).toContain(
      `Image: https://example.com/mountain.jpg\n\nMountain walk`,
    );
    expect(emailText).toContain("Starts:");
    expect(emailText).toContain("Location: Table Mountain");
    expect(emailText).toContain("Cost: R125.00");
    expect(emailText).toContain("Organiser: Alex Walker");
    expect(emailText).toContain("A scenic walk.");
    expect(emailText).toContain(`View the meet: ${url}`);
    expect(emailText.indexOf("Starts:")).toBeLessThan(
      emailText.indexOf("Location:"),
    );
    expect(emailText.indexOf("Organiser:")).toBeLessThan(
      emailText.indexOf("A scenic walk."),
    );

    fireEvent.click(screen.getByRole("button", { name: "QR Code" }));
    expect(screen.getByRole("button", { name: "QR Code" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText(url)).toBeInTheDocument();
    expect(document.querySelector("svg")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Copy Link" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(url));
    expect(success).toHaveBeenCalledWith("Meet link copied");

    fireEvent.click(screen.getByRole("button", { name: "Poster" }));
    expect(openMeetPosterPrintWindow).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Mountain walk",
        qrUrl: url,
        organizationName: "Summit Explorers",
        organizationLogoUrl: "https://example.com/logo.png",
      }),
    );
  });

  it("opens as a bottom drawer on mobile", () => {
    setMobile(true);
    render(<MeetShare open onClose={vi.fn()} meet={meet} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("Share Mountain walk")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "WhatsApp" }).closest(".MuiCard-root"),
    ).toBeInTheDocument();
  });

  it("offers native sharing as More... when available", async () => {
    setMobile(true);
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: share,
    });
    render(<MeetShare open onClose={vi.fn()} meet={meet} />);

    fireEvent.click(screen.getByRole("button", { name: "More..." }));
    await waitFor(() =>
      expect(share).toHaveBeenCalledWith({
        title: "Mountain walk",
        text: expect.stringContaining("Location: Table Mountain"),
        url: `${window.location.origin}/share/share-123`,
      }),
    );
    expect(share.mock.calls[0][0].text).not.toContain("View the meet:");
    expect(screen.getByText("Share Mountain walk")).toBeInTheDocument();
  });

  it("opens the linked WhatsApp composer for a meet organiser", () => {
    render(<MeetShare open onClose={vi.fn()} meet={meet} canManageMeet />);
    fireEvent.click(screen.getByRole("button", { name: "WhatsApp" }));
    expect(screen.getByText("Composer opened")).toBeInTheDocument();
  });
});
