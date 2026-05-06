type Json = Record<string, any> | Array<any>;

type ApiOptions = {
  baseUrl?: string;
  token?: string;
};

type RequestModeOptions = {
  includeJsonContentType?: boolean;
};

class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function readErrorMessage(res: Response): Promise<string> {
  const bodyText = await res.text();
  if (!bodyText) {
    return `Request failed with status ${res.status}`;
  }
  try {
    const parsed = JSON.parse(bodyText) as { message?: unknown };
    if (typeof parsed.message === "string" && parsed.message.trim()) {
      return parsed.message;
    }
    if (Array.isArray(parsed.message) && parsed.message.length) {
      return parsed.message.join(", ");
    }
  } catch {
    // Ignore JSON parse failures and fall back to plain text below.
  }
  return bodyText;
}

export function useApi(options: ApiOptions = {}) {
  const envBaseUrl =
    import.meta.env.VITE_API_BASEURL || import.meta.env.API_BASEURL;
  const baseNoSlash = (
    options.baseUrl ||
    envBaseUrl ||
    "http://localhost:3000"
  ).replace(/\/+$/, "");
  const baseUrl = baseNoSlash.endsWith("/api/v1")
    ? baseNoSlash
    : `${baseNoSlash}/api/v1`;
  const getAccessToken = () =>
    options.token ||
    (typeof window !== "undefined"
      ? window.localStorage.getItem("accessToken")
      : null) ||
    undefined;
  const getRefreshToken = () =>
    typeof window !== "undefined"
      ? window.localStorage.getItem("refreshToken")
      : null;
  const shouldSkipNavigation =
    import.meta.env.MODE === "test" ||
    (typeof navigator !== "undefined" && /jsdom/i.test(navigator.userAgent));

  const redirectToLogin = () => {
    if (typeof window === "undefined") return;
    if (window.location.pathname === "/login") return;
    if (shouldSkipNavigation) return;
    window.location.assign("/login");
  };

  async function refreshToken(): Promise<string | null> {
    const refreshTokenValue = getRefreshToken();
    if (!refreshTokenValue) return null;
    const res = await fetch(`${baseUrl}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: refreshTokenValue }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (
      data?.accessToken &&
      data?.refreshToken &&
      typeof window !== "undefined"
    ) {
      window.localStorage.setItem("accessToken", data.accessToken);
      window.localStorage.setItem("refreshToken", data.refreshToken);
    }
    return data?.accessToken || null;
  }

  const buildHeaders = (
    tokenOverride?: string | null,
    includeJsonContentType = true,
  ) => {
    const common: Record<string, string> = {};
    if (includeJsonContentType) {
      common["Content-Type"] = "application/json";
    }
    const token = tokenOverride ?? options.token ?? null;
    if (token) {
      common.Authorization = `Bearer ${token}`;
    }
    return common;
  };

  const mergeHeaders = (
    baseHeaders: Record<string, string>,
    extraHeaders?: HeadersInit,
  ) => {
    const headers = new Headers();
    Object.entries(baseHeaders).forEach(([key, value]) => {
      headers.set(key, value);
    });
    if (extraHeaders) {
      new Headers(extraHeaders).forEach((value, key) => {
        headers.set(key, value);
      });
    }
    return headers;
  };

  async function request<T>(
    path: string,
    init?: RequestInit,
    isRetry = false,
    modeOptions: RequestModeOptions = {},
  ): Promise<T> {
    const { includeJsonContentType = true } = modeOptions;
    const token = getAccessToken();
    const headers = mergeHeaders(
      buildHeaders(token, includeJsonContentType),
      init?.headers,
    );
    const res = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers,
    });
    if (res.status === 401 && typeof window !== "undefined") {
      if (!isRetry && getRefreshToken()) {
        const newToken = await refreshToken();
        if (newToken) {
          return request<T>(
            path,
            {
              ...init,
              headers: mergeHeaders(
                buildHeaders(newToken, includeJsonContentType),
                init?.headers,
              ),
            },
            true,
            modeOptions,
          );
        }
      }
      const message = await readErrorMessage(res);
      window.localStorage.removeItem("accessToken");
      window.localStorage.removeItem("refreshToken");
      if (token || getRefreshToken()) {
        redirectToLogin();
      }
      throw new ApiError(401, message || "Unauthorized");
    }
    if (!res.ok) {
      const message = await readErrorMessage(res);
      throw new ApiError(
        res.status,
        message || `Request failed with status ${res.status}`,
      );
    }
    if (res.status === 204) {
      return undefined as T;
    }
    return (await res.json()) as T;
  }

  async function get<T>(path: string, init?: RequestInit) {
    return request<T>(path, { ...init, method: "GET" });
  }

  async function post<T>(path: string, body?: Json, init?: RequestInit) {
    return request<T>(path, {
      ...init,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async function patch<T>(path: string, body?: Json, init?: RequestInit) {
    return request<T>(path, {
      ...init,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async function postForm<T>(path: string, body: FormData, init?: RequestInit) {
    return request<T>(
      path,
      {
        ...init,
        method: "POST",
        body,
      },
      false,
      { includeJsonContentType: false },
    );
  }

  async function del<T>(path: string, init?: RequestInit) {
    return request<T>(path, { ...init, method: "DELETE" });
  }

  return { baseUrl, get, post, patch, postForm, del };
}
