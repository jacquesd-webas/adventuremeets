import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { useApi } from "./useApi";

export type CreateMeetPayload = {
  name?: string;
  description?: string;
  organizerId?: string;
  location?: string;
  locationLat?: number;
  locationLong?: number;
  startTime?: string;
  startTimeTbc?: boolean;
  endTime?: string;
  endTimeTbc?: boolean;
  useMap?: boolean;
  openingDate?: string | null;
  closingDate?: string | null;
  scheduledDate?: string;
  confirmDate?: string;
  capacity?: number | null;
  waitlistSize?: number | null;
  statusId?: number;
  autoPlacement?: boolean;
  autoPromoteWaitlist?: boolean;
  allowGuests?: boolean;
  maxGuests?: number;
  isVirtual?: boolean;
  accessLink?: string;
  confirmMessage?: string;
  rejectMessage?: string;
  waitlistMessage?: string;
  allowMinorIndemnity?: boolean;
  currencyCode?: string;
  costCents?: number;
  depositCents?: number;
  hasIndemnity?: boolean;
  indemnity?: string;
  metaDefinitions?: {
    id?: string;
    fieldKey: string;
    label: string;
    fieldType: string;
    required?: boolean;
    config?: Record<string, any>;
  }[];
};

type SaveMeetArgs = {
  meetId?: string | null;
  payload: CreateMeetPayload;
};

export function useSaveMeet(defaultMeetId?: string | null) {
  const api = useApi();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ meetId, payload }: SaveMeetArgs) => {
      if (!meetId) {
        return api.post("/meets", payload);
      }
      return api.patch(`/meets/${meetId}`, payload);
    },
    onError: (error: any) => {
      const message =
        (error?.message as string) ||
        (typeof error === "string" ? error : "Failed to save meet");
      enqueueSnackbar(message, { variant: "error" });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["meets"] });
      const meetId = variables.meetId ?? (data as any)?.id;
      if (meetId) {
        queryClient.invalidateQueries({ queryKey: ["meet", meetId] });
      }
    },
  });

  const save = async (
    payload: Record<string, any>,
    meetIdOverride?: string | null,
  ) => {
    const result = await mutation.mutateAsync({
      meetId: meetIdOverride ?? defaultMeetId,
      payload,
    });
    return result as Record<string, any>;
  };

  return {
    save,
    isSaving: mutation.isPending,
    error: mutation.error,
  };
}
