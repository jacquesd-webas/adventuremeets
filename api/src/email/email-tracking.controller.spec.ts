import { EmailTrackingController } from "./email-tracking.controller";

describe("EmailTrackingController", () => {
  it("records valid 48-character tokens and returns a GIF", async () => {
    const emailService = {
      recordOpened: jest.fn().mockResolvedValue(1),
    };
    const response = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    } as any;
    const controller = new EmailTrackingController(emailService as any);

    await controller.trackOpen("a".repeat(48), response);

    expect(emailService.recordOpened).toHaveBeenCalledWith("a".repeat(48));
    expect(response.setHeader).toHaveBeenCalledWith(
      "Content-Type",
      "image/gif",
    );
    expect(response.send).toHaveBeenCalledWith(expect.any(Buffer));
  });

  it("does not query the database for malformed tokens", async () => {
    const emailService = { recordOpened: jest.fn() };
    const response = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    } as any;
    const controller = new EmailTrackingController(emailService as any);

    await controller.trackOpen("not-a-token", response);

    expect(emailService.recordOpened).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(200);
  });
});
