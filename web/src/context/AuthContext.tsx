import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from "react";
import { useFetchMe } from "../hooks/useFetchMe";
import { useApi } from "../hooks/useApi";
import { Me } from "../types/MeModel";

type AuthContextValue = {
  user: Me | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);

type Props = {
  children: ReactNode;
};

export function AuthProvider({ children }: Props) {
  const api = useApi();
  const refreshInFlight = useRef(false);
  const refetchRef = useRef<() => Promise<unknown>>(async () => undefined);

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

  const { user, isLoading, refetch } = useFetchMe({
    onUnauthorized: handleUnauthorized,
  });
  refetchRef.current = refetch;

  const refreshSession = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const logout = useCallback(async () => {
    (await api.post("/auth/logout")) || "/auth/logout";
    refetch();
  }, [api, refetch]);

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

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
