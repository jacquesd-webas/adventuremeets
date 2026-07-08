import { ReactNode, useEffect, useMemo, useState } from "react";
import { useAuth } from "./authContext";
import {
  OrganizationContext,
  OrganizationContextValue,
} from "./organizationContext";
import { useFetchOrganization } from "../hooks/useFetchOrganization";
import { useLocation } from "react-router-dom";
import { isPublicRoutePath } from "../helpers/publicRoutes";

type OrganizationProviderProps = {
  children: ReactNode;
};

const storageKey = "currentOrganizationId";

export function OrganizationProvider({ children }: OrganizationProviderProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const isPublicRoute = isPublicRoutePath(location.pathname);

  const [currentOrganizationId, setCurrentOrganizationId] = useState<
    string | null
  >(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(storageKey);
  });
  const [lastKnownOrganizations, setLastKnownOrganizations] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    if (!user) {
      setLastKnownOrganizations({});
      return;
    }
    const currentOrganizations = user.organizations || {};
    if (Object.keys(currentOrganizations).length > 0) {
      setLastKnownOrganizations(currentOrganizations);
    }
  }, [user]);

  const effectiveOrganizations = useMemo(() => {
    const currentOrganizations = user?.organizations || {};
    if (Object.keys(currentOrganizations).length > 0) {
      return currentOrganizations;
    }
    return lastKnownOrganizations;
  }, [lastKnownOrganizations, user?.organizations]);

  const organizationIds = useMemo(() => {
    return Object.keys(effectiveOrganizations);
  }, [effectiveOrganizations]);

  const canFetchOrganization = Boolean(user) && !isPublicRoute;
  const { data: organization } = useFetchOrganization(
    canFetchOrganization ? currentOrganizationId || undefined : undefined,
  );

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
  }, [
    currentOrganizationId,
    isLoading,
    isPublicRoute,
    location.pathname,
    organizationIds,
    user,
  ]);

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
    if (!currentOrganizationId) return null;
    return effectiveOrganizations[currentOrganizationId] || null;
  }, [currentOrganizationId, effectiveOrganizations]);

  const value = useMemo<OrganizationContextValue>(
    () => ({
      organizationIds,
      currentOrganizationId,
      currentOrganizationName: organization?.name || null,
      currentOrganizationRole,
      setCurrentOrganizationId,
    }),
    [
      organizationIds,
      currentOrganizationId,
      organization?.name,
      currentOrganizationRole,
      setCurrentOrganizationId,
    ],
  );

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}
