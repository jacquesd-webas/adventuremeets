import { createContext, useContext } from "react";

export type OrganizationContextValue = {
  organizationIds: string[];
  currentOrganizationId: string | null;
  currentOrganizationRole: string | null;
  setCurrentOrganizationId: (orgId: string | null) => void;
};

export const OrganizationContext =
  createContext<OrganizationContextValue | undefined>(undefined);

export function useCurrentOrganization() {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error(
      "useCurrentOrganization must be used within OrganizationProvider"
    );
  }
  return context;
}
