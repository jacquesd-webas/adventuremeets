import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useFetchMe } from "../hooks/useFetchMe";
import { useApi } from "../hooks/useApi";
import { useQueryClient } from "@tanstack/react-query";
import { AuthContext, AuthContextValue } from "./authContext";
import { Me } from "../types/MeModel";

type Props = {
  children: ReactNode;
};

const cachedMeStorageKey = "auth.me";

export function AuthProvider({ children }: Props) {
  const api = useApi();
  const refreshInFlight = useRef(false);
  const refetchRef = useRef<() => Promise<unknown>>(async () => undefined);
  const queryClient = useQueryClient();
  const [cachedUser, setCachedUser] = useState<Me | null>(() => {
    if (typeof window === "undefined") return null;
    const token = window.localStorage.getItem("accessToken");
    if (!token) return null;
    try {
      const raw = window.localStorage.getItem(cachedMeStorageKey);
      return raw ? (JSON.parse(raw) as Me) : null;
    } catch {
      return null;
    }
  });

  const handleUnauthorized = useCallback(async () => {
    if (refreshInFlight.current) return;
    refreshInFlight.current = true;
    try {
      await api.post("/auth/refresh");
      await refetchRef.current();
      return;
    } catch {
      if (
        typeof window !== "undefined" &&
        window.location.pathname !== "/login"
      ) {
        window.location.assign("/login");
      }
    } finally {
      refreshInFlight.current = false;
    }
  }, [api]);

  const {
    data: user,
    isLoading,
    updatedAt,
    refetch,
  } = useFetchMe({
    onUnauthorized: handleUnauthorized,
  });
  refetchRef.current = refetch;

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (user) {
      setCachedUser(user);
      window.localStorage.setItem(cachedMeStorageKey, JSON.stringify(user));
      return;
    }

    const token = window.localStorage.getItem("accessToken");
    if (!token) {
      setCachedUser(null);
      window.localStorage.removeItem(cachedMeStorageKey);
    }
  }, [user]);

  const refreshSession = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const logout = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("accessToken");
      window.localStorage.removeItem("refreshToken");
      window.localStorage.removeItem(cachedMeStorageKey);
    }
    setCachedUser(null);
    queryClient.setQueryData(["auth", "me"], null);
    queryClient.clear();
  }, [queryClient]);

  const resolvedUser = user ?? cachedUser;
  const resolvedIsLoading = isLoading && !resolvedUser;

  const value = useMemo<AuthContextValue>(
    () => ({
      user: resolvedUser,
      isLoading: resolvedIsLoading,
      isAuthenticated: Boolean(resolvedUser),
      meUpdatedAt: updatedAt,
      refreshSession,
      logout,
    }),
    [resolvedUser, resolvedIsLoading, updatedAt, refreshSession, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
