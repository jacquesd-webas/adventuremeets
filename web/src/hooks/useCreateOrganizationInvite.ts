import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./useApi";

type CreateOrganizationInvitePayload = {
  organizationId: string;
  email: string;
  roleId: number;
  expiresAt?: string;
};

type OrganizationInvite = {
  id: string;
  organizationId: string;
  email: string;
  token: string;
  roleId: number;
  roleName?: string;
  createdAt: string;
  expiresAt: string;
  acceptedAt?: string | null;
  declinedAt?: string | null;
  createdBy?: string;
  inviteUrl?: string;
};

type CreateOrganizationInviteResponse =
  | { invite: OrganizationInvite }
  | OrganizationInvite;

export function useCreateOrganizationInvite() {
  const api = useApi();
  const queryClient = useQueryClient();

  const mutation = useMutation<
    OrganizationInvite,
    Error,
    CreateOrganizationInvitePayload
  >({
    mutationFn: async ({ organizationId, ...payload }) => {
      const res = await api.post<CreateOrganizationInviteResponse>(
        `/organizations/${organizationId}/invites`,
        payload,
      );
      return (res as any).invite ?? (res as OrganizationInvite);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["organization-invites", variables.organizationId],
      });
    },
  });

  return {
    createInvite: mutation.mutate,
    createInviteAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error ? mutation.error.message : null,
  };
}
