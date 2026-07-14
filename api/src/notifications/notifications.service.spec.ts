import { createHash } from "crypto";
import { NotificationsService } from "./notifications.service";
import { NotificationTypeName } from "./dto/send-notification.dto";

describe("NotificationsService", () => {
  const baseMeet = {
    id: "meet-1",
    name: "Camping Meet",
    organizerId: "user-1",
    organizerName: "Taylor",
    organizerFirstName: "Taylor",
    organizerEmail: "taylor@example.com",
    organizationId: "org-1",
  } as any;

  function buildService(options?: {
    attendeeIds?: string[];
    latestNotification?: { id: string; hash: string | null } | null;
    outstandingResponses?: number;
  }) {
    const attendeeIds = options?.attendeeIds ?? ["att-1", "att-2"];
    const latestNotification = options?.latestNotification ?? null;
    const outstandingResponses = options?.outstandingResponses ?? 2;

    const countBuilder = {
      where: jest.fn().mockReturnThis(),
      whereNull: jest.fn().mockReturnThis(),
      count: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue({ count: String(outstandingResponses) }),
    };

    const attendeeHashBuilder = {
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      select: jest
        .fn()
        .mockResolvedValue(attendeeIds.map((id) => ({ id }))),
    };

    const latestNotificationBuilder = {
      join: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue(latestNotification),
    };

    const notificationTypeBuilder = {
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue({ id: 3 }),
    };

    const notificationsInsertBuilder = {
      insert: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([{ id: "notif-2" }]),
    };

    const meetAttendeesBuilders = [countBuilder, attendeeHashBuilder];

    const client: any = (table: string) => {
      if (table === "meet_attendees") {
        const builder = meetAttendeesBuilders.shift();
        if (!builder) throw new Error("Unexpected meet_attendees query");
        return builder;
      }
      if (table === "notifications as n") return latestNotificationBuilder;
      if (table === "notification_types") return notificationTypeBuilder;
      if (table === "notifications") return notificationsInsertBuilder;
      throw new Error(`Unexpected table ${table}`);
    };

    const db = {
      getClient: () => client,
    } as any;

    const emailService = {
      sendEmail: jest.fn().mockResolvedValue(undefined),
    } as any;

    const meetsService = {
      findOne: jest.fn().mockResolvedValue(baseMeet),
    } as any;

    return {
      service: new NotificationsService(db, emailService, meetsService),
      emailService,
      notificationsInsertBuilder,
      meetsService,
    };
  }

  it("skips organiser response reminders when the attendee hash has not changed", async () => {
    const unchangedHash = createHash("sha256")
      .update("att-1|att-2")
      .digest("hex");
    const { service, emailService, notificationsInsertBuilder } = buildService({
      attendeeIds: ["att-1", "att-2"],
      latestNotification: { id: "notif-1", hash: unchangedHash },
    });

    const result = await service.sendNotification({
      notificationType:
        NotificationTypeName.OrganiserReminderResponsesNeeded,
      meetId: "meet-1",
    });

    expect(result).toEqual({
      status: "skipped",
      notificationType:
        NotificationTypeName.OrganiserReminderResponsesNeeded,
      notificationId: "notif-1",
      to: "taylor@example.com",
    });
    expect(emailService.sendEmail).not.toHaveBeenCalled();
    expect(notificationsInsertBuilder.insert).not.toHaveBeenCalled();
  });

  it("stores the attendee hash when the organiser response reminder is sent", async () => {
    const { service, emailService, notificationsInsertBuilder } = buildService({
      attendeeIds: ["att-1", "att-3"],
      latestNotification: { id: "notif-1", hash: "old-hash" },
    });

    const result = await service.sendNotification({
      notificationType:
        NotificationTypeName.OrganiserReminderResponsesNeeded,
      meetId: "meet-1",
    });

    const expectedHash = createHash("sha256")
      .update("att-1|att-3")
      .digest("hex");

    expect(result).toEqual({
      status: "sent",
      notificationType:
        NotificationTypeName.OrganiserReminderResponsesNeeded,
      notificationId: "notif-2",
      to: "taylor@example.com",
    });
    expect(emailService.sendEmail).toHaveBeenCalledTimes(1);
    expect(notificationsInsertBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        meet_id: "meet-1",
        hash: expectedHash,
      }),
    );
  });

  it("skips organiser check-in reminders when the attendee hash has not changed", async () => {
    const unchangedHash = createHash("sha256")
      .update("att-1|att-2")
      .digest("hex");
    const countBuilder = {
      where: jest.fn().mockReturnThis(),
      whereIn: jest.fn().mockReturnThis(),
      count: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue({ count: "0" }),
    };
    const attendeeHashBuilder = {
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      select: jest
        .fn()
        .mockResolvedValue([{ id: "att-1" }, { id: "att-2" }]),
    };
    const latestNotificationBuilder = {
      join: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue({ id: "notif-9", hash: unchangedHash }),
    };
    const client: any = (table: string) => {
      if (table === "meet_attendees") {
        if (!client._builders) client._builders = [countBuilder, attendeeHashBuilder];
        return client._builders.shift();
      }
      if (table === "notifications as n") return latestNotificationBuilder;
      throw new Error(`Unexpected table ${table}`);
    };
    const service = new NotificationsService(
      { getClient: () => client } as any,
      { sendEmail: jest.fn() } as any,
      { findOne: jest.fn().mockResolvedValue(baseMeet) } as any,
    );

    const result = await service.sendNotification({
      notificationType: NotificationTypeName.OrganizerReminderCheckinNeeded,
      meetId: "meet-1",
    });

    expect(result).toEqual({
      status: "skipped",
      notificationType: NotificationTypeName.OrganizerReminderCheckinNeeded,
      notificationId: "notif-9",
      to: "taylor@example.com",
    });
  });

  it("recreates a missing notification type before sending a check-in reminder", async () => {
    const countBuilder = {
      where: jest.fn().mockReturnThis(),
      whereIn: jest.fn().mockReturnThis(),
      count: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue({ count: "0" }),
    };
    const attendeeHashBuilder = {
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      select: jest
        .fn()
        .mockResolvedValue([{ id: "att-1" }, { id: "att-2" }]),
    };
    const latestNotificationBuilder = {
      join: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue(null),
    };

    let notificationTypeLookupCount = 0;
    const notificationTypeBuilder = {
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockImplementation(async () => {
        notificationTypeLookupCount += 1;
        return notificationTypeLookupCount === 1 ? null : { id: 5 };
      }),
    };
    const notificationTypeInsertBuilder = {
      insert: jest.fn().mockReturnThis(),
      onConflict: jest.fn().mockReturnThis(),
      ignore: jest.fn().mockResolvedValue(undefined),
    };
    const notificationsInsertBuilder = {
      insert: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([{ id: "notif-10" }]),
    };

    const client: any = (table: string) => {
      if (table === "meet_attendees") {
        if (!client._builders) client._builders = [countBuilder, attendeeHashBuilder];
        return client._builders.shift();
      }
      if (table === "notifications as n") return latestNotificationBuilder;
      if (table === "notification_types") {
        if (!client._notificationTypeBuilders) {
          client._notificationTypeBuilders = [
            notificationTypeBuilder,
            notificationTypeInsertBuilder,
            notificationTypeBuilder,
          ];
        }
        return client._notificationTypeBuilders.shift();
      }
      if (table === "notifications") return notificationsInsertBuilder;
      throw new Error(`Unexpected table ${table}`);
    };

    const emailService = {
      sendEmail: jest.fn().mockResolvedValue(undefined),
    } as any;

    const service = new NotificationsService(
      { getClient: () => client } as any,
      emailService,
      { findOne: jest.fn().mockResolvedValue(baseMeet) } as any,
    );

    const result = await service.sendNotification({
      notificationType: NotificationTypeName.OrganizerReminderCheckinNeeded,
      meetId: "meet-1",
    });

    expect(notificationTypeInsertBuilder.insert).toHaveBeenCalledWith({
      id: 5,
      name: NotificationTypeName.OrganizerReminderCheckinNeeded,
    });
    expect(notificationTypeInsertBuilder.onConflict).toHaveBeenCalledWith(
      "name",
    );
    expect(notificationTypeInsertBuilder.ignore).toHaveBeenCalled();
    expect(emailService.sendEmail).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      status: "sent",
      notificationType: NotificationTypeName.OrganizerReminderCheckinNeeded,
      notificationId: "notif-10",
      to: "taylor@example.com",
    });
  });
});
