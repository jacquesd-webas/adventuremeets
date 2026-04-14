import type { Request } from "express";
import { buildMeetSharePageHtml } from "./meet-share-page";

describe("buildMeetSharePageHtml", () => {
  function buildRequest(originalUrl = "/share/share-123") {
    return {
      originalUrl,
      protocol: "https",
      headers: {},
      get: jest.fn().mockReturnValue("api.example.com"),
    } as unknown as Request;
  }

  it("prepends the formatted meet date to the og description", () => {
    const { html } = buildMeetSharePageHtml({
      req: buildRequest(),
      code: "share-123",
      frontendUrl: "https://app.example.com",
      meetName: "Test Meet",
      meetDescription: "Join us on the mountain.",
      meetStartTime: "2026-04-14T07:00:00.000Z",
      meetTimeZone: "Africa/Johannesburg",
    });

    expect(html).toContain(
      'meta property="og:description" content="Tuesday, 14 April 2026\nJoin us on the mountain."',
    );
  });

  it("falls back to the description when no start time is available", () => {
    const { html } = buildMeetSharePageHtml({
      req: buildRequest(),
      code: "share-123",
      frontendUrl: "https://app.example.com",
      meetDescription: "Join this meet.",
    });

    expect(html).toContain(
      'meta property="og:description" content="Join this meet."',
    );
  });
});
