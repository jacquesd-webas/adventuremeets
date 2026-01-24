type Json = Record<string, any> | Array<any>;

type ApiOptions = {
  baseUrl?: string;
  token?: string;
};

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

  const buildHeaders = (tokenOverride?: string | null) => {
    const common: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const token = tokenOverride ?? options.token ?? null;
    if (token) {
      common.Authorization = `Bearer ${token}`;
    }
    return common;
  };

  async function request<T>(
    path: string,
    init?: RequestInit,
    isRetry = false
  ): Promise<T> {
    const token = getAccessToken();
    const headers: Record<string, string> = buildHeaders(token);
    const res = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        ...headers,
      },
    });
    if (res.status === 401 && typeof window !== "undefined") {
      if (!isRetry && getRefreshToken()) {
        const newToken = await refreshToken();
        if (newToken) {
          return request<T>(
            path,
            {
              ...init,
              headers: {
                ...headers,
                Authorization: `Bearer ${newToken}`,
              },
            },
            true
          );
        }
      }
      window.localStorage.removeItem("accessToken");
      window.localStorage.removeItem("refreshToken");
      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
      throw new Error("Unauthorized");
    }
    if (!res.ok) {
      const message = await res.text();
      throw new Error(message || `Request failed with status ${res.status}`);
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

  async function del<T>(path: string, init?: RequestInit) {
    return request<T>(path, { ...init, method: "DELETE" });
  }

  return { baseUrl, get, post, patch, del };
}
