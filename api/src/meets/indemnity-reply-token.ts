import { createHmac, timingSafeEqual } from "crypto";

export function indemnityReplyToken(
  meetId: string,
  attendeeId: string,
): string {
  return createHmac("sha256", process.env.JWT_SECRET || "dev-secret")
    .update(`signed-indemnity:${meetId}:${attendeeId}`)
    .digest("hex")
    .slice(0, 32);
}

export function validIndemnityReplyToken(
  meetId: string,
  attendeeId: string,
  token?: string,
): boolean {
  if (!token || !/^[a-f0-9]{32}$/i.test(token)) return false;
  const expected = Buffer.from(indemnityReplyToken(meetId, attendeeId), "hex");
  return timingSafeEqual(expected, Buffer.from(token, "hex"));
}
