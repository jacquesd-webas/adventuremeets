import { createContext, useContext } from "react";
import { Me } from "../types/MeModel";

export type AuthContextValue = {
  user: Me | undefined | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  meUpdatedAt: number;
  refreshSession: () => Promise<void>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
