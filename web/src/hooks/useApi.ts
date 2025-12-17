import { useMemo } from "react";

type Json = Record<string, any> | Array<any>;

type ApiOptions = {
  baseUrl?: string;
  token?: string;
};

export function useApi(options: ApiOptions = {}) {
  // TODO: use baseUrl from options or env
  const baseUrl = "http://localhost:9000"
  
  const headers = useMemo(() => {
    const common: Record<string, string> = {
      "Content-Type": "application/json"
    };
    if (options.token) {
      common.Authorization = `Bearer ${options.token}`;
    }
    return common;
  }, [options.token]);

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        ...headers,
        ...(init?.headers || {})
      }
    });
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

  return { baseUrl, get, post };
}
