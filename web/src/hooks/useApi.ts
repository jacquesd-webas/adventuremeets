import { useMemo } from "react";

type Json = Record<string, any> | Array<any>;

type ApiOptions = {
  baseUrl?: string;
  token?: string;
};

export function useApi(options: ApiOptions = {}) {
  const envBaseUrl = import.meta.env.VITE_API_BASEURL || import.meta.env.API_BASEURL;
  const baseUrl = options.baseUrl || envBaseUrl || "http://localhost:3000";
  const storedToken = typeof window !== "undefined" ? window.localStorage.getItem("accessToken") : null;
  const token = options.token || storedToken || undefined;
  
  const headers = useMemo(() => {
    const common: Record<string, string> = {
      "Content-Type": "application/json"
    };
    if (token) {
      common.Authorization = `Bearer ${token}`;
    }
    return common;
  }, [token]);

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        ...headers,
        ...(init?.headers || {})
      }
    });
    if (res.status === 401 && typeof window !== "undefined") {
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
      body: body ? JSON.stringify(body) : undefined
    });
  }

  async function patch<T>(path: string, body?: Json, init?: RequestInit) {
    return request<T>(path, {
      ...init,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined
    });
  }

  async function del<T>(path: string, init?: RequestInit) {
    return request<T>(path, { ...init, method: "DELETE" });
  }

  return { baseUrl, get, post, patch, del };
}
