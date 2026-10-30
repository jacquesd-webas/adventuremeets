import { StreamableFile } from "@nestjs/common";
import { IS_PUBLIC_KEY } from "../auth/decorators/public.decorator";
import { ObjectStorageController } from "./object-storage.controller";
import { ObjectStorageService } from "./object-storage.service";

describe("ObjectStorageController", () => {
  it("serves an image stream from the public API route", async () => {
    const stream = { pipe: jest.fn() };
    const storage = {
      getImage: jest.fn().mockResolvedValue({
        stream,
        contentType: "image/webp",
        size: 10,
      }),
    } as unknown as ObjectStorageService;
    const controller = new ObjectStorageController(storage);

    const response = await controller.getImage("logos/org-1/logo.webp");

    expect(Reflect.getMetadata(IS_PUBLIC_KEY, controller.getImage)).toBe(true);
    expect(storage.getImage).toHaveBeenCalledWith("logos/org-1/logo.webp");
    expect(response).toBeInstanceOf(StreamableFile);
    expect(response.getHeaders()).toEqual(
      expect.objectContaining({ type: "image/webp", length: 10 }),
    );
  });
});
