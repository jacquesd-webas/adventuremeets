import { meetShareMessage } from "../meetShareMessage";

const meet = {
  id: "meet-1",
  name: "Mountain walk",
  organizerId: "organizer-1",
  startTime: "2026-11-01T08:00:00+02:00",
  startTimeTbc: true,
  description: "Bring water.",
};

describe("meetShareMessage", () => {
  it("omits unknown time, location, cost, and organiser", () => {
    const message = meetShareMessage(
      meet,
      "https://example.com/share/one",
      "email",
    );
    expect(message).toContain("Starts:");
    expect(message).not.toContain(" at ");
    expect(message).not.toContain("Location:");
    expect(message).not.toContain("Cost:");
    expect(message).not.toContain("Organiser:");
    expect(message).toContain("Bring water.");
  });

  it("keeps a WhatsApp caption within the message limit", () => {
    const message = meetShareMessage(
      { ...meet, startTimeTbc: false, description: "A".repeat(5000) },
      "https://example.com/share/one",
      "whatsapp",
      true,
    );
    expect(message.length).toBeLessThanOrEqual(3000);
    expect(message).toContain("View the meet: https://example.com/share/one");
  });
});
