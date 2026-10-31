import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MeetWhatsappComposer } from "../MeetWhatsappComposer";

const mutateAsync = vi.fn().mockResolvedValue({ sent: true });
const success = vi.fn();
vi.mock("../../../hooks/useMeetWhatsapp", () => ({
  useMeetWhatsappChats: () => ({
    data: [{ id: "group@g.us", name: "Hiking group", isGroup: true }],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
  useSendMeetWhatsapp: () => ({ mutateAsync, isPending: false, error: null }),
}));
vi.mock("../../../hooks/useNotistack", () => ({
  useNotistack: () => ({ success }),
}));

describe("MeetWhatsappComposer", () => {
  it("previews meet details and image, then sends to a selected group", async () => {
    const onClose = vi.fn();
    render(
      <MeetWhatsappComposer
        meet={{
          id: "meet-1",
          name: "Mountain walk",
          organizerId: "organizer-1",
          shareCode: "share-123",
          location: "Table Mountain",
          costCents: 12500,
          currencySymbol: "R",
          organizerName: "Alex Walker",
          description: "A scenic walk.",
          imageUrl: "https://example.com/primary.jpg",
          startTime: "2026-11-01T08:00:00+02:00",
          endTime: "2026-11-01T12:00:00+02:00",
        }}
        onClose={onClose}
      />,
    );

    expect(
      (screen.getByLabelText("Message") as HTMLInputElement).value,
    ).toContain("Mountain walk");
    expect(
      (screen.getByLabelText("Message") as HTMLInputElement).value,
    ).toContain("Table Mountain");
    expect(
      (screen.getByLabelText("Message") as HTMLInputElement).value,
    ).toContain("R125.00");
    expect(
      (screen.getByLabelText("Message") as HTMLInputElement).value,
    ).toContain("Alex Walker");
    expect(
      (screen.getByLabelText("Message") as HTMLInputElement).value,
    ).toContain("A scenic walk.");
    expect(screen.getByAltText("Meet primary image")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Send WhatsApp message" }),
    ).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Send to"), {
      target: { value: "Hiking" },
    });
    fireEvent.click(await screen.findByText("Hiking group (Group)"));
    fireEvent.click(
      screen.getByRole("button", { name: "Send WhatsApp message" }),
    );

    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          chatId: "group@g.us",
          includeImage: true,
          message: expect.stringContaining("R125.00"),
        }),
      ),
    );
    expect(success).toHaveBeenCalledWith("Sent to Hiking group");
    expect(onClose).toHaveBeenCalled();
  });
});
