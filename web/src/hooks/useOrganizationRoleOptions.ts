import { useMemo } from "react";
import { useFetchRoles } from "./useFetchRoles";

export type OrganizationRoleOption = {
  id: number;
  name: "admin" | "organizer" | "member";
  label: string;
};

const ROLE_OPTIONS: OrganizationRoleOption[] = [
  { id: 2, name: "admin", label: "Admin" },
  { id: 3, name: "organizer", label: "Organizer" },
  { id: 4, name: "member", label: "Member" },
];

export function useOrganizationRoleOptions() {
  const { data: roles, isLoading, error, refetch } = useFetchRoles();
  const roleOptions = useMemo<OrganizationRoleOption[]>(() => {
    if (!roles.length) return ROLE_OPTIONS;
    const filtered = roles.filter(
      (role): role is { id: number; name: "admin" | "organizer" | "member" } =>
        role.name === "admin" ||
        role.name === "organizer" ||
        role.name === "member",
    );
    if (!filtered.length) return ROLE_OPTIONS;
    return filtered.map((role) => ({
      id: role.id,
      name: role.name,
      label: role.name.charAt(0).toUpperCase() + role.name.slice(1),
    }));
  }, [roles]);

  const defaultRoleId = useMemo(() => {
    return roleOptions.find((role) => role.name === "member")?.id ?? 4;
  }, [roleOptions]);

  return {
    roleOptions,
    defaultRoleId,
    isLoading,
    error,
    refetch,
  };
}
