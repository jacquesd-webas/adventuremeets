import { Readable } from "stream";
import { MeetWhatsappService } from "./meet-whatsapp.service";
import { ObjectStorageService } from "../storage/object-storage.service";
import { MeetDto } from "./dto/meet.dto";

describe("MeetWhatsappService", () => {
  const originalUrl = process.env.WHATSAPP_SERVICE_URL;
  const originalKey = process.env.WORKER_API_KEY;

  afterEach(() => {
    process.env.WHATSAPP_SERVICE_URL = originalUrl;
    process.env.WORKER_API_KEY = originalKey;
    jest.restoreAllMocks();
  });

  it("loads the primary image from storage and sends it with the message", async () => {
    process.env.WHATSAPP_SERVICE_URL = "http://whatsapp:3010";
    process.env.WORKER_API_KEY = "secret";
    const getImage = jest.fn().mockResolvedValue({
      stream: Readable.from([Buffer.from("image")]),
      contentType: "image/jpeg",
      size: 5,
    });
    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ sent: true }),
    } as Response);
    const service = new MeetWhatsappService({
      getImage,
    } as unknown as ObjectStorageService);
    const meet = {
      organizationId: "org-1",
      images: [{ isPrimary: true, objectKey: "meets/meet-1/primary.jpg" }],
    } as MeetDto;

    await service.send(meet, {
      chatId: "group@g.us",
      message: " Meet details ",
      includeImage: true,
    });

    expect(getImage).toHaveBeenCalledWith("meets/meet-1/primary.jpg");
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("http://whatsapp:3010/send");
    expect(options?.headers).toEqual(
      expect.objectContaining({ "x-api-key": "secret" }),
    );
    expect(JSON.parse(String(options?.body))).toEqual({
      organizationId: "org-1",
      chatId: "group@g.us",
      message: "Meet details",
      image: {
        mimeType: "image/jpeg",
        base64: Buffer.from("image").toString("base64"),
      },
    });
  });
});
