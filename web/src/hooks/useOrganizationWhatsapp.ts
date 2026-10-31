import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./useApi";
import { organizationQueryKeys } from "./organizationQueryKeys";

export type OrganizationWhatsappConnection = {
  status:
    | "disconnected"
    | "connecting"
    | "qr"
    | "connected"
    | "disconnecting"
    | "error";
  phone: string | null;
  qr: string | null;
  connectedAt: string | null;
  error: string | null;
};

export function useOrganizationWhatsapp(organizationId?: string | null) {
  const api = useApi();
  return useQuery({
    queryKey: organizationQueryKeys.whatsapp(organizationId ?? undefined),
    enabled: Boolean(organizationId),
    queryFn: () =>
      api.get<OrganizationWhatsappConnection>(
        `/organizations/${organizationId}/whatsapp`,
      ),
    refetchInterval: (query) =>
      ["connecting", "qr", "disconnecting"].includes(
        query.state.data?.status ?? "",
      )
        ? 3000
        : query.state.data?.status === "connected"
          ? 10000
          : false,
  });
}

export function useConnectOrganizationWhatsapp(organizationId?: string | null) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.post<OrganizationWhatsappConnection>(
        `/organizations/${organizationId}/whatsapp`,
        {},
      ),
    onSuccess: (connection) => {
      queryClient.setQueryData(
        organizationQueryKeys.whatsapp(organizationId ?? undefined),
        connection,
      );
      queryClient.invalidateQueries({
        queryKey: organizationQueryKeys.detail(organizationId ?? undefined),
      });
    },
  });
}

export function useDisconnectOrganizationWhatsapp(
  organizationId?: string | null,
) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.del<OrganizationWhatsappConnection>(
        `/organizations/${organizationId}/whatsapp`,
      ),
    onSuccess: (connection) => {
      queryClient.setQueryData(
        organizationQueryKeys.whatsapp(organizationId ?? undefined),
        connection,
      );
      queryClient.invalidateQueries({
        queryKey: organizationQueryKeys.detail(organizationId ?? undefined),
      });
    },
  });
}
