import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useApi } from "../useApi";

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

describe("useApi", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it("refreshes the token and retries after a 401", async () => {
    window.localStorage.setItem("accessToken", "old-access");
    window.localStorage.setItem("refreshToken", "old-refresh");

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("", { status: 401 }))
      .mockResolvedValueOnce(
        jsonResponse({
          accessToken: "new-access",
          refreshToken: "new-refresh",
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ ok: true }));

    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() =>
      useApi({ baseUrl: "http://localhost:8000" }),
    );

    await expect(result.current.get("/meets")).resolves.toEqual({ ok: true });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "http://localhost:8000/api/v1/meets",
    );
    expect(
      new Headers(fetchMock.mock.calls[0]?.[1]?.headers).get("Authorization"),
    ).toBe("Bearer old-access");

    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      "http://localhost:8000/api/v1/auth/refresh",
    );
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({
      method: "POST",
      body: JSON.stringify({ refreshToken: "old-refresh" }),
    });

    expect(fetchMock.mock.calls[2]?.[0]).toBe(
      "http://localhost:8000/api/v1/meets",
    );
    expect(
      new Headers(fetchMock.mock.calls[2]?.[1]?.headers).get("Authorization"),
    ).toBe("Bearer new-access");

    expect(window.localStorage.getItem("accessToken")).toBe("new-access");
    expect(window.localStorage.getItem("refreshToken")).toBe("new-refresh");
  });

  it("surfaces the API message for anonymous 401 responses", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(
          { message: "Incorrect email or password" },
          { status: 401 },
        ),
      );

    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() =>
      useApi({ baseUrl: "http://localhost:8000" }),
    );

    await expect(
      result.current.post("/auth/login", {
        email: "user@example.com",
        password: "bad-password",
      }),
    ).rejects.toMatchObject({
      message: "Incorrect email or password",
      status: 401,
    });
  });

  it("deduplicates concurrent refresh requests", async () => {
    window.localStorage.setItem("accessToken", "old-access");
    window.localStorage.setItem("refreshToken", "old-refresh");

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("", { status: 401 }))
      .mockResolvedValueOnce(new Response("", { status: 401 }))
      .mockResolvedValueOnce(
        jsonResponse({
          accessToken: "new-access",
          refreshToken: "new-refresh",
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ ok: "a" }))
      .mockResolvedValueOnce(jsonResponse({ ok: "b" }));

    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() =>
      useApi({ baseUrl: "http://localhost:8000" }),
    );

    await expect(
      Promise.all([result.current.get("/meets"), result.current.get("/types")]),
    ).resolves.toEqual([{ ok: "a" }, { ok: "b" }]);

    const refreshCalls = fetchMock.mock.calls.filter(
      (call) => call[0] === "http://localhost:8000/api/v1/auth/refresh",
    );

    expect(refreshCalls).toHaveLength(1);
  });

  it("reuses the refreshed token when an older request returns a delayed 401", async () => {
    window.localStorage.setItem("accessToken", "old-access");
    window.localStorage.setItem("refreshToken", "old-refresh");

    let resolveDelayedResponse!: (response: Response) => void;
    const delayedResponse = new Promise<Response>((resolve) => {
      resolveDelayedResponse = resolve;
    });
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => delayedResponse)
      .mockResolvedValueOnce(new Response("", { status: 401 }))
      .mockResolvedValueOnce(
        jsonResponse({
          accessToken: "new-access",
          refreshToken: "new-refresh",
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ ok: "meets" }))
      .mockResolvedValueOnce(jsonResponse({ ok: "organization" }));

    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() =>
      useApi({ baseUrl: "http://localhost:8000" }),
    );

    const organizationRequest = result.current.get("/organizations/org-1");
    await expect(result.current.get("/meets")).resolves.toEqual({
      ok: "meets",
    });

    resolveDelayedResponse(new Response("", { status: 401 }));
    await expect(organizationRequest).resolves.toEqual({ ok: "organization" });

    const refreshCalls = fetchMock.mock.calls.filter(
      (call) => call[0] === "http://localhost:8000/api/v1/auth/refresh",
    );

    expect(refreshCalls).toHaveLength(1);
    expect(fetchMock.mock.calls[4]?.[0]).toBe(
      "http://localhost:8000/api/v1/organizations/org-1",
    );
    expect(
      new Headers(fetchMock.mock.calls[4]?.[1]?.headers).get("Authorization"),
    ).toBe("Bearer new-access");
    expect(window.localStorage.getItem("accessToken")).toBe("new-access");
    expect(window.localStorage.getItem("refreshToken")).toBe("new-refresh");
  });

  it.each([429, 503])(
    "keeps the session after refresh returns %s and recovers on a later request",
    async (status) => {
      window.localStorage.setItem("accessToken", "old-access");
      window.localStorage.setItem("refreshToken", "old-refresh");

      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response("", { status: 401 }))
        .mockResolvedValueOnce(
          jsonResponse({ message: "Please try again later" }, { status }),
        )
        .mockResolvedValueOnce(new Response("", { status: 401 }))
        .mockResolvedValueOnce(
          jsonResponse({
            accessToken: "new-access",
            refreshToken: "new-refresh",
          }),
        )
        .mockResolvedValueOnce(jsonResponse({ ok: true }));

      vi.stubGlobal("fetch", fetchMock);

      const { result } = renderHook(() =>
        useApi({ baseUrl: "http://localhost:8000" }),
      );

      await expect(result.current.get("/meets")).rejects.toMatchObject({
        status,
        message: "Please try again later",
      });

      expect(window.localStorage.getItem("accessToken")).toBe("old-access");
      expect(window.localStorage.getItem("refreshToken")).toBe("old-refresh");

      await expect(result.current.get("/meets")).resolves.toEqual({ ok: true });

      expect(fetchMock.mock.calls[3]?.[1]).toMatchObject({
        method: "POST",
        body: JSON.stringify({ refreshToken: "old-refresh" }),
      });
      expect(window.localStorage.getItem("accessToken")).toBe("new-access");
      expect(window.localStorage.getItem("refreshToken")).toBe("new-refresh");
    },
  );

  it("clears the session when the refresh token is rejected", async () => {
    window.localStorage.setItem("accessToken", "old-access");
    window.localStorage.setItem("refreshToken", "old-refresh");

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ message: "Unauthorized" }, { status: 401 }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ message: "Invalid refresh token" }, { status: 401 }),
      );

    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() =>
      useApi({ baseUrl: "http://localhost:8000" }),
    );

    await expect(result.current.get("/meets")).rejects.toMatchObject({
      status: 401,
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(window.localStorage.getItem("accessToken")).toBeNull();
    expect(window.localStorage.getItem("refreshToken")).toBeNull();
  });
});
