import { Client } from "minio";
import { AttendeeItemsStorageService } from "./attendee-items-storage.service";

jest.mock("minio", () => ({ Client: jest.fn() }));

describe("AttendeeItemsStorageService", () => {
  const originalEnvironment = { ...process.env };
  const client = {
    bucketExists: jest.fn().mockResolvedValue(true),
    makeBucket: jest.fn(),
    putObject: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (Client as unknown as jest.Mock).mockImplementation(() => client);
    process.env.S3_ENDPOINT = "https://s3.garage.example.com";
    process.env.S3_ACCESS_KEY_ID = "access-key";
    process.env.S3_SECRET_ACCESS_KEY = "secret-key";
    process.env.S3_REGION = "garage";
    process.env.S3_FORCE_PATH_STYLE = "true";
    process.env.S3_ATTENDEE_ITEMS_BUCKET = "attendee-items";
  });

  afterAll(() => {
    for (const key of [
      "S3_ENDPOINT",
      "S3_ACCESS_KEY_ID",
      "S3_SECRET_ACCESS_KEY",
      "S3_REGION",
      "S3_FORCE_PATH_STYLE",
      "S3_ATTENDEE_ITEMS_BUCKET",
    ]) {
      if (originalEnvironment[key] === undefined) delete process.env[key];
      else process.env[key] = originalEnvironment[key];
    }
  });

  it("uses the same Garage endpoint and region for private attendee uploads", async () => {
    const service = new AttendeeItemsStorageService();
    const pdf = Buffer.from("%PDF-1.4");

    await service.upload("attendees/one.pdf", pdf);

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
      "attendee-items",
      "attendees/one.pdf",
      pdf,
      pdf.length,
      { "Content-Type": "application/pdf" },
    );
    expect(client.makeBucket).not.toHaveBeenCalled();
  });
});
