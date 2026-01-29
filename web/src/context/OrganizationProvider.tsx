import {
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "./authContext";
import {
  OrganizationContext,
  OrganizationContextValue,
} from "./organizationContext";

type OrganizationProviderProps = {
  children: ReactNode;
};

const storageKey = "currentOrganizationId";

export function OrganizationProvider({ children }: OrganizationProviderProps) {
  const { user, isLoading } = useAuth();

  const [currentOrganizationId, setCurrentOrganizationId] = useState<
    string | null
  >(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(storageKey);
  });

  const organizationIds = useMemo(() => {
    if (!user?.organizations) return [];
    return Object.keys(user.organizations);
  }, [user]);

  // Set or clear current organization based on user's organizations
  useEffect(() => {
    if (isLoading) return;
    // Have a user but no organizations, clear current organization
    if (user && !organizationIds.length) {
      setCurrentOrganizationId(null);
      return;
    }
    // Have a organization, but it's not in user's organizations, clear it
    if (
      currentOrganizationId &&
      !organizationIds.includes(currentOrganizationId)
    ) {
      setCurrentOrganizationId(null);
      return;
    }
    // User only has one organization, set it automatically
    if (!currentOrganizationId && organizationIds.length === 1) {
      setCurrentOrganizationId(organizationIds[0]);
      return;
    }
  }, [organizationIds, currentOrganizationId, isLoading, user]);

  // Persist current organization to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (currentOrganizationId) {
      window.localStorage.setItem(storageKey, currentOrganizationId);
    } else {
      window.localStorage.removeItem(storageKey);
    }
  }, [currentOrganizationId]);

  const currentOrganizationRole = useMemo(() => {
    if (!user?.organizations || !currentOrganizationId) return null;
    return user.organizations[currentOrganizationId] || null;
  }, [user?.organizations, currentOrganizationId]);

  const value = useMemo<OrganizationContextValue>(
    () => ({
      organizationIds,
      currentOrganizationId,
      currentOrganizationRole,
      setCurrentOrganizationId,
    }),
    [
      organizationIds,
      currentOrganizationId,
      currentOrganizationRole,
      setCurrentOrganizationId,
    ]
  );

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}
