import { DatabaseService } from "../database/database.service";
import { EmailMessagesRepository } from "./email-messages.repository";

describe("EmailMessagesRepository", () => {
  it("links each recipient to only their own saved messages, including shared addresses", async () => {
    const queries: Array<{ whereIn: jest.Mock; whereNull: jest.Mock; update: jest.Mock }> = [];
    const trx = jest.fn(() => {
      const query = {
        whereIn: jest.fn().mockReturnThis(),
        whereNull: jest.fn().mockReturnThis(),
        update: jest.fn().mockResolvedValue(1),
      };
      queries.push(query);
      return query;
    });
    const transaction = jest.fn(async (callback) => callback(trx));
    const repository = new EmailMessagesRepository({
      getClient: () => ({ transaction }),
    } as unknown as DatabaseService);
    await repository.linkOutboundEmails([
      { id: "outgoing-a", recipient_email: "alice@example.com" },
      { id: "outgoing-b", recipient_email: "bob@example.com" },
    ], [
      { messageId: "message-a1", recipient: "Alice@example.com" },
      { messageId: "message-a2", recipient: "alice@example.com" },
      { messageId: "message-b", recipient: "bob@example.com" },
    ]);
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(queries[0].whereIn).toHaveBeenCalledWith("message_id", ["message-a1", "message-a2"]);
    expect(queries[0].update).toHaveBeenCalledWith({ outbound_email_id: "outgoing-a" });
    expect(queries[1].whereIn).toHaveBeenCalledWith("message_id", ["message-b"]);
    expect(queries[1].update).toHaveBeenCalledWith({ outbound_email_id: "outgoing-b" });
    expect(queries[1].whereNull).toHaveBeenCalledWith("outbound_email_id");
  });
});
