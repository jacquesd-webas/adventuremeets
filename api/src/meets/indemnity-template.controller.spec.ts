import {
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { IndemnityTemplateController } from "./indemnity-template.controller";
import { MEET_STATUS } from "./constants/meet-status.enum";

describe("IndemnityTemplateController", () => {
  const meet = {
    id: "meet-1",
    organizationId: "org-1",
    organizerId: "organizer-1",
    statusId: MEET_STATUS.Draft,
  };
  const user = { id: "organizer-1" };
  const meets = { findOne: jest.fn().mockResolvedValue(meet) };
  const auth = {
    hasRole: jest
      .fn()
      .mockImplementation((_user, _org, role) => role === "organizer"),
  };
  const templates = {
    get: jest.fn(),
    getPreview: jest.fn(),
    upload: jest
      .fn()
      .mockResolvedValue({ filename: "form.pdf", questions: [] }),
    remove: jest.fn().mockResolvedValue(undefined),
  };
  const controller = new IndemnityTemplateController(
    meets as any,
    auth as any,
    templates as any,
  );

  beforeEach(() => {
    meets.findOne.mockResolvedValue(meet);
    templates.upload.mockClear();
    templates.remove.mockClear();
    templates.getPreview.mockReset();
  });

  it("only permits the organiser or an admin to upload", async () => {
    await expect(
      controller.upload("meet-1", {} as any, { id: "other" } as any),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(templates.upload).not.toHaveBeenCalled();
  });

  it("rejects changes after applications open", async () => {
    meets.findOne.mockResolvedValueOnce({
      ...meet,
      statusId: MEET_STATUS.Open,
    });
    await expect(
      controller.upload("meet-1", {} as any, user as any),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(templates.upload).not.toHaveBeenCalled();
  });

  it("delegates an authorised upload", async () => {
    const file = {
      buffer: Buffer.from("pdf"),
      size: 3,
      originalname: "form.pdf",
    };
    await controller.upload("meet-1", file, user as any);
    expect(templates.upload).toHaveBeenCalledWith("meet-1", file);
  });

  it("serves the private PDF preview only to a manager", async () => {
    const response = { setHeader: jest.fn() };
    templates.getPreview.mockResolvedValue(Buffer.from("%PDF-preview"));

    await expect(
      controller.preview("meet-1", response as any, { id: "other" } as any),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(templates.getPreview).not.toHaveBeenCalled();

    const result = await controller.preview(
      "meet-1",
      response as any,
      user as any,
    );
    expect(templates.getPreview).toHaveBeenCalledWith("meet-1");
    expect(response.setHeader).toHaveBeenCalledWith(
      "Content-Type",
      "application/pdf",
    );
    expect(response.setHeader).toHaveBeenCalledWith(
      "Cache-Control",
      "private, no-store",
    );
    expect(result).toBeDefined();

    templates.getPreview.mockResolvedValueOnce(null);
    await expect(
      controller.preview("meet-1", response as any, user as any),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("only removes a form before applications open", async () => {
    await expect(
      controller.remove("meet-1", { id: "other" } as any),
    ).rejects.toBeInstanceOf(ForbiddenException);
    meets.findOne.mockResolvedValueOnce({
      ...meet,
      statusId: MEET_STATUS.Open,
    });
    await expect(
      controller.remove("meet-1", user as any),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(templates.remove).not.toHaveBeenCalled();

    await expect(controller.remove("meet-1", user as any)).resolves.toEqual({
      deleted: true,
    });
    expect(templates.remove).toHaveBeenCalledWith("meet-1");
  });
});
