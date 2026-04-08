import { IconButton, Tooltip } from "@mui/material";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { useApi } from "../../hooks/useApi";

type AttendeeUploadButtonProps = {
  meetId?: string | null;
  disabled?: boolean;
};

type UploadResponse = {
  created: number;
  skipped?: number;
};

export function AttendeeUploadButton({
  meetId,
  disabled = false,
}: AttendeeUploadButtonProps) {
  const api = useApi();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const mutation = useMutation<UploadResponse, Error, File>({
    mutationFn: async (file) => {
      if (!meetId) {
        throw new Error("Meet is required for uploads");
      }
      const formData = new FormData();
      formData.append("file", file);
      const token =
        typeof window !== "undefined"
          ? window.localStorage.getItem("accessToken")
          : null;
      const res = await fetch(
        `${api.baseUrl}/meets/${meetId}/attendees/upload`,
        {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          body: formData,
        }
      );
      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || "Failed to upload attendees");
      }
      return (await res.json()) as UploadResponse;
    },
    onSuccess: (data) => {
      const created = data?.created ?? 0;
      const skipped = data?.skipped ?? 0;
      const message = skipped
        ? `Uploaded ${created} attendee(s). Skipped ${skipped} row(s).`
        : `Uploaded ${created} attendee(s).`;
      enqueueSnackbar(message, {
        variant: "success",
        anchorOrigin: { vertical: "bottom", horizontal: "right" },
      });
      if (meetId) {
        queryClient.invalidateQueries({
          queryKey: ["meet-attendees", meetId],
          exact: false,
        });
      }
    },
    onError: (error) => {
      enqueueSnackbar(error.message || "Failed to upload attendees", {
        variant: "error",
        anchorOrigin: { vertical: "bottom", horizontal: "right" },
      });
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
