import {
  ReactNode,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useFetchMe } from "../hooks/useFetchMe";
import { useApi } from "../hooks/useApi";
import { useQueryClient } from "@tanstack/react-query";
import { AuthContext, AuthContextValue } from "./authContext";

type Props = {
  children: ReactNode;
};

export function AuthProvider({ children }: Props) {
  const api = useApi();
  const refreshInFlight = useRef(false);
  const refetchRef = useRef<() => Promise<unknown>>(async () => undefined);
  const queryClient = useQueryClient();

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
    refetch,
  } = useFetchMe({
    onUnauthorized: handleUnauthorized,
  });
  refetchRef.current = refetch;

  const refreshSession = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const logout = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("accessToken");
      window.localStorage.removeItem("refreshToken");
    }
    queryClient.setQueryData(["auth", "me"], null);
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      refreshSession,
      logout,
    }),
    [user, isLoading, refreshSession, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
