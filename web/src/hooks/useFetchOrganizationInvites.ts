import { useQuery } from "@tanstack/react-query";
import { useApi } from "./useApi";

export type OrganizationInviteStatus = "accepted" | "declined" | "pending";

export type OrganizationInvite = {
  id: string;
  organizationId: string;
  email: string;
  token: string;
  roleId: number;
  roleName?: string;
  createdAt?: string;
  expiresAt?: string;
  acceptedAt?: string | null;
  declinedAt?: string | null;
  createdBy?: string;
  inviteUrl?: string;
  status: OrganizationInviteStatus;
};

type OrganizationInvitesResponse =
  | { invites: OrganizationInvite[] }
  | OrganizationInvite[];

export function useFetchOrganizationInvites(orgId?: string) {
  const api = useApi();

  const query = useQuery({
    queryKey: ["organization-invites", orgId],
    enabled: Boolean(orgId),
    queryFn: async () => {
      const res = await api.get<OrganizationInvitesResponse>(
        `/organizations/${orgId}/invites`,
      );
      const invites = Array.isArray(res) ? res : res.invites || [];
      return invites.map(mapInvite);
    },
  });

  return {
    data: (query.data || []) as OrganizationInvite[],
    isLoading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch,
  };
}

function mapInvite(invite: any): OrganizationInvite {
  const acceptedAt = invite.acceptedAt ?? invite.accepted_at ?? null;
  const declinedAt = invite.declinedAt ?? invite.declined_at ?? null;
  return {
    id: invite.id,
    organizationId: invite.organizationId ?? invite.organization_id,
    email: invite.email,
    token: invite.token,
    roleId: invite.roleId ?? invite.role_id,
    roleName: invite.roleName ?? invite.role_name,
    createdAt: invite.createdAt ?? invite.created_at,
    expiresAt: invite.expiresAt ?? invite.expires_at,
    acceptedAt,
    declinedAt,
    createdBy: invite.createdBy ?? invite.created_by,
    inviteUrl: invite.inviteUrl ?? invite.invite_url,
    status: acceptedAt ? "accepted" : declinedAt ? "declined" : "pending",
  };
}
