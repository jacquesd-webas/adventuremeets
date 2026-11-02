import { BadRequestException } from "@nestjs/common";
import { Readable } from "stream";
import { MeetWhatsappService } from "./meet-whatsapp.service";
import { ObjectStorageService } from "../storage/object-storage.service";
import { MeetDto } from "./dto/meet.dto";
import { DatabaseService } from "../database/database.service";

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
    const service = new MeetWhatsappService(
      {
        getImage,
      } as unknown as ObjectStorageService,
      {} as DatabaseService,
    );
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

  it("creates a group once and stores its WhatsApp ID on the meet", async () => {
    process.env.WHATSAPP_SERVICE_URL = "http://whatsapp:3010";
    process.env.WORKER_API_KEY = "secret";
    const meetRow = {
      id: "meet-1",
      name: "Mountain walk",
      organization_id: "org-1",
      organizer_id: "organizer-1",
      status_id: 2,
      whatsapp_group_id: null as string | null,
    };
    const trx = Object.assign(
      (table: string) => ({
        where: () => ({
          forUpdate: () => ({ first: async () => meetRow }),
          first: async () =>
            table === "organization_config"
              ? { whatsapp_status: "connected" }
              : { phone: "+27987654321" },
          update: async (values: { whatsapp_group_id: string }) => {
            meetRow.whatsapp_group_id = values.whatsapp_group_id;
          },
        }),
      }),
      { fn: { now: () => new Date() } },
    );
    const database = {
      getClient: () => ({
        transaction: (callback: (transaction: typeof trx) => unknown) =>
          callback(trx),
      }),
    } as unknown as DatabaseService;
    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ chatId: "new-group@g.us", organizerAdded: true }),
    } as Response);
    const service = new MeetWhatsappService(
      {} as ObjectStorageService,
      database,
    );
    const meet = { id: "meet-1" } as MeetDto;

    expect(await service.createGroup(meet)).toEqual({
      chatId: "new-group@g.us",
      organizerAdded: true,
    });
    expect(meetRow.whatsapp_group_id).toBe("new-group@g.us");
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      organizationId: "org-1",
      title: "Mountain walk",
      organizerPhone: "+27987654321",
    });
    expect(await service.createGroup(meet)).toEqual({
      chatId: "new-group@g.us",
      organizerAdded: true,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("fetches the stored group's invite link", async () => {
    process.env.WHATSAPP_SERVICE_URL = "http://whatsapp:3010";
    process.env.WORKER_API_KEY = "secret";
    const row = { organization_id: "org-1", whatsapp_group_id: "group-1@g.us" };
    const database = {
      getClient: () => () => ({ where: () => ({ first: async () => row }) }),
    } as unknown as DatabaseService;
    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ url: "https://chat.whatsapp.com/InviteCode123" }),
    } as Response);
    const service = new MeetWhatsappService(
      {} as ObjectStorageService,
      database,
    );
    expect(await service.groupInviteLink({ id: "meet-1" } as MeetDto)).toEqual({
      url: "https://chat.whatsapp.com/InviteCode123",
    });
    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://whatsapp:3010/groups/invite?organizationId=org-1&chatId=group-1%40g.us",
    );
  });

  it("does not request an invite when the meet has no group", async () => {
    const database = {
      getClient: () => () => ({
        where: () => ({ first: async () => ({ whatsapp_group_id: null }) }),
      }),
    } as unknown as DatabaseService;
    const fetchMock = jest.spyOn(global, "fetch");
    const service = new MeetWhatsappService(
      {} as ObjectStorageService,
      database,
    );
    await expect(
      service.groupInviteLink({ id: "meet-1" } as MeetDto),
    ).rejects.toThrow(BadRequestException);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
