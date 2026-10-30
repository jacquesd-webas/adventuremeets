import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Client } from "minio";
import { ObjectStorageService } from "./object-storage.service";

jest.mock("minio", () => ({ Client: jest.fn() }));

const client = {
  putObject: jest.fn(),
  removeObject: jest.fn(),
  statObject: jest.fn(),
  getObject: jest.fn(),
};
const configKeys = [
  "S3_ENDPOINT",
  "S3_ACCESS_KEY_ID",
  "S3_SECRET_ACCESS_KEY",
  "S3_BUCKET",
  "API_BASEURL",
  "S3_REGION",
  "S3_FORCE_PATH_STYLE",
  "MINIO_ENDPOINT",
  "MINIO_ROOT_USER",
  "MINIO_ROOT_PASSWORD",
] as const;

describe("ObjectStorageService", () => {
  const originalEnvironment = Object.fromEntries(
    configKeys.map((key) => [key, process.env[key]]),
  );

  beforeEach(() => {
    jest.clearAllMocks();
    (Client as unknown as jest.Mock).mockImplementation(() => client);
    process.env.S3_ENDPOINT = "https://s3.garage.example.com";
    process.env.S3_ACCESS_KEY_ID = "access-key";
    process.env.S3_SECRET_ACCESS_KEY = "secret-key";
    process.env.S3_BUCKET = "meet-images";
    process.env.API_BASEURL = "https://api.example.com/api/v1";
    process.env.S3_REGION = "garage";
    process.env.S3_FORCE_PATH_STYLE = "true";
  });

  afterAll(() => {
    configKeys.forEach((key) => {
      const value = originalEnvironment[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    });
  });

  it("uploads through the S3 API and returns the API image URL", async () => {
    client.putObject.mockResolvedValue(undefined);
    const service = new ObjectStorageService();

    await expect(
      service.upload(
        "meets/meet-1/image.jpg",
        Buffer.from("image"),
        "image/jpeg",
      ),
    ).resolves.toEqual({
      objectKey: "meets/meet-1/image.jpg",
      url: "https://api.example.com/api/v1/storage/images?key=meets%2Fmeet-1%2Fimage.jpg",
    });

    expect(Client).toHaveBeenCalledWith({
      endPoint: "s3.garage.example.com",
      port: 443,
      useSSL: true,
      accessKey: "access-key",
      secretKey: "secret-key",
      region: "garage",
      pathStyle: true,
    });
    expect(client.putObject).toHaveBeenCalledWith(
      "meet-images",
      "meets/meet-1/image.jpg",
      expect.any(Buffer),
      5,
      { "Content-Type": "image/jpeg" },
    );
  });

  it("does not attempt MinIO bucket creation or policy configuration", async () => {
    client.removeObject.mockResolvedValue(undefined);
    const service = new ObjectStorageService();

    await expect(
      service.remove("meets/meet-1/image.jpg"),
    ).resolves.toBeUndefined();

    expect(client.removeObject).toHaveBeenCalledWith(
      "meet-images",
      "meets/meet-1/image.jpg",
    );
  });

  it("wraps S3 errors as a client-safe API error", async () => {
    client.putObject.mockRejectedValue(new Error("Access denied"));
    const service = new ObjectStorageService();

    await expect(
      service.upload(
        "meets/meet-1/image.jpg",
        Buffer.from("image"),
        "image/jpeg",
      ),
    ).rejects.toEqual(expect.any(BadRequestException));
  });

  it("streams an image from the configured image bucket", async () => {
    const stream = { pipe: jest.fn() };
    client.statObject.mockResolvedValue({
      size: 5,
      metaData: { "content-type": "image/webp" },
    });
    client.getObject.mockResolvedValue(stream);

    await expect(
      new ObjectStorageService().getImage("logos/org-1/logo.webp"),
    ).resolves.toEqual({ stream, contentType: "image/webp", size: 5 });
    expect(client.statObject).toHaveBeenCalledWith(
      "meet-images",
      "logos/org-1/logo.webp",
    );
    expect(client.getObject).toHaveBeenCalledWith(
      "meet-images",
      "logos/org-1/logo.webp",
    );
  });

  it("rejects non-image objects and keys outside image paths", async () => {
    const service = new ObjectStorageService();
    client.statObject.mockResolvedValue({
      metaData: { "content-type": "application/pdf" },
    });
    await expect(
      service.getImage("meets/meet-1/indemnity/form.pdf"),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      service.getImage("attendee-items/private.pdf"),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(client.getObject).not.toHaveBeenCalled();
  });

  it("returns 404 when the image object no longer exists", async () => {
    client.statObject.mockRejectedValue({ code: "NoSuchKey" });
    await expect(
      new ObjectStorageService().getImage("wall/meet-1/photo.jpg"),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("requires S3 credentials instead of falling back to MinIO variables", () => {
    delete process.env.S3_ENDPOINT;
    delete process.env.S3_ACCESS_KEY_ID;
    delete process.env.S3_SECRET_ACCESS_KEY;
    process.env.MINIO_ENDPOINT = "minio.example.com";
    process.env.MINIO_ROOT_USER = "legacy-access-key";
    process.env.MINIO_ROOT_PASSWORD = "legacy-secret-key";

    expect(() => new ObjectStorageService()).toThrow(
      "S3-compatible object storage is not configured",
    );
  });
});
