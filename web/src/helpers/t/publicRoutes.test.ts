import { describe, expect, it } from "vitest";
import { isPublicRoutePath } from "../publicRoutes";

describe("isPublicRoutePath", () => {
  it("treats public auth pages as public", () => {
    expect(isPublicRoutePath("/login")).toBe(true);
    expect(isPublicRoutePath("/register")).toBe(true);
  });

  it("treats meet share routes as public", () => {
    expect(isPublicRoutePath("/meets/share-123")).toBe(true);
    expect(isPublicRoutePath("/meets/share-123/attendee-1")).toBe(true);
    expect(isPublicRoutePath("/share/share-123")).toBe(true);
  });

  it("does not treat app shell routes as public", () => {
    expect(isPublicRoutePath("/")).toBe(false);
    expect(isPublicRoutePath("/plan")).toBe(false);
    expect(isPublicRoutePath("/calendar")).toBe(false);
  });
});
