import { IconButton, Tooltip } from "@mui/material";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { useApi } from "../../hooks/useApi";

type AttendeeUploadButtonProps = {
  meetId?: string | null;
  disabled?: boolean;
  onUploadSuccess?: (data: AttendeeUploadResponse) => void;
  onUploadError?: () => void;
};

export type AttendeeUploadConflict = {
  rowNumber?: number;
  email: string;
  uploadedName: string;
  conflictingNames: string[];
  existingAttendeeId: string;
  attendee: {
    name: string;
    email: string;
    phone: string;
    rowNumber?: number;
    metaValues?: Array<{ definitionId: string; value: string }>;
  };
};

export type AttendeeUploadResponse = {
  created: number;
  skipped?: number;
  conflicts?: AttendeeUploadConflict[];
};

export type AttendeeUploadConflictAction =
  | "ignore"
  | "replace"
  | "add_as_minor";

export function AttendeeUploadButton({
  meetId,
  disabled = false,
  onUploadSuccess,
  onUploadError,
}: AttendeeUploadButtonProps) {
  const api = useApi();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const mutation = useMutation<AttendeeUploadResponse, Error, File>({
    mutationFn: async (file) => {
      if (!meetId) {
        throw new Error("Meet is required for uploads");
      }
      const formData = new FormData();
      formData.append("file", file);
      return api.postForm<AttendeeUploadResponse>(
        `/meets/${meetId}/attendees/upload`,
        formData,
      );
    },
    onSuccess: (data) => {
      const created = data?.created ?? 0;
      const skipped = data?.skipped ?? 0;
      const conflictCount = data?.conflicts?.length ?? 0;
      const messageParts = [`Uploaded ${created} attendee(s).`];
      if (skipped) {
        messageParts.push(`Skipped ${skipped} row(s).`);
      }
      if (conflictCount) {
        messageParts.push(`${conflictCount} conflicted row(s) need review.`);
      }
      enqueueSnackbar(messageParts.join(" "), {
        variant: conflictCount ? "warning" : "success",
        anchorOrigin: { vertical: "bottom", horizontal: "right" },
      });
      onUploadSuccess?.(data);
      if (meetId) {
        queryClient.invalidateQueries({
          queryKey: ["meet-attendees", meetId],
          exact: false,
        });
      }
    },
    onError: () => {
      onUploadError?.();
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    mutation.mutate(file);
  };

  return (
    <Tooltip title="Upload attendees">
      <span>
        <IconButton
          component="label"
          aria-label="Upload attendees"
          size="small"
          disabled={disabled || mutation.isPending || !meetId}
        >
          <FileUploadOutlinedIcon fontSize="small" />
          <input
            hidden
            type="file"
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            onChange={handleFileChange}
          />
        </IconButton>
      </span>
    </Tooltip>
  );
}
