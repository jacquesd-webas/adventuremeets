import { useApi } from "./useApi";
import { useQuery } from "@tanstack/react-query";
import { OrganizationMember } from "../types/MemberModel";

type MembersResponse = { members: OrganizationMember[] } | OrganizationMember[];

export function useFetchOrganizationMembers(orgId?: string) {
  const api = useApi();

  const query = useQuery({
    queryKey: ["organization-members", orgId],
    enabled: Boolean(orgId),
    queryFn: async () => {
      const res = await api.get<MembersResponse>(
        `/organizations/${orgId}/members`
      );
      if (Array.isArray(res)) {
        return res.map(mapMember);
      }
      return (res as any).members?.map(mapMember) || [];
    },
  });

  return {
    data: (query.data || []) as OrganizationMember[],
    isLoading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch,
  };
}

const mapMember = (member: any): OrganizationMember => ({
  id: member.id,
  email: member.email,
  firstName: member.firstName ?? member.first_name,
  lastName: member.lastName ?? member.last_name,
  role: member.role,
  status: member.status,
  createdAt: member.createdAt ?? member.created_at,
  updatedAt: member.updatedAt ?? member.updated_at,
});
