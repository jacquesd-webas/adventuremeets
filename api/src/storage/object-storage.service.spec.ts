import { BadRequestException } from "@nestjs/common";
import { Client } from "minio";
import { ObjectStorageService } from "./object-storage.service";

jest.mock("minio", () => ({ Client: jest.fn() }));

const client = {
  putObject: jest.fn(),
  removeObject: jest.fn(),
};
const configKeys = [
  "S3_ENDPOINT",
  "S3_ACCESS_KEY_ID",
  "S3_SECRET_ACCESS_KEY",
  "S3_BUCKET",
  "S3_PUBLIC_URL",
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
    process.env.S3_PUBLIC_URL = "https://meet-images.web.example.com";
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

  it("uploads through the S3 API and returns the configured public object URL", async () => {
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
      url: "https://meet-images.web.example.com/meets/meet-1/image.jpg",
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
