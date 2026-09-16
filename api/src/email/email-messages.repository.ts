import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";

export type EmailMessageReference = { messageId: string; recipient: string };

@Injectable()
export class EmailMessagesRepository {
  constructor(private readonly db: DatabaseService) {}

  async linkOutboundEmails(
    emails: Array<{ id: string; recipient_email: string }>,
    references: EmailMessageReference[],
  ): Promise<void> {
    await this.db.getClient().transaction(async (trx) => {
      for (const email of emails) {
        const messageIds = references
          .filter((reference) => reference.recipient.trim().toLowerCase() === email.recipient_email)
          .map((reference) => reference.messageId);
        if (!messageIds.length) continue;
        await trx("messages").whereIn("message_id", messageIds)
          .whereNull("outbound_email_id").update({ outbound_email_id: email.id });
      }
    });
  }
}
