import { Alert, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { useCloneMeet } from "../../hooks/useCloneMeet";
import { useFetchMeet } from "../../hooks/useFetchMeet";
import { ConfirmActionDialog } from "../ConfirmActionDialog";

type ConfirmCloneMeetDialogProps = {
  open: boolean;
  meetId?: string | null;
  canManageMeet?: boolean;
  isOrganizer?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
};

export function ConfirmCloneMeetDialog({
  open,
  meetId,
  onClose,
  onConfirm,
  isLoading = false,
}: ConfirmCloneMeetDialogProps) {
  const { cloneMeetAsync, isLoading: isSubmitting } = useCloneMeet();
  const {
    data: meet,
    isLoading: isMeetLoading,
    error: meetError,
  } = useFetchMeet(meetId, open && Boolean(meetId));
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setName("");
      setError(null);
      return;
    }

    if (meet?.name) {
      setName(`${meet.name} Copy`);
    }
  }, [open, meet?.name]);

  const trimmedName = name.trim();

  const handleClone = async () => {
    if (!meetId) return;
    if (!trimmedName) {
      setError("Meet name is required");
      return;
    }

    try {
      setError(null);
      await cloneMeetAsync({ meetId, name: trimmedName });
      onConfirm();
    } catch (err: any) {
      setError(err?.message || "Failed to create copy");
    }
  };

  return (
    <ConfirmActionDialog
      open={open}
      title="Create a copy?"
      description="All information will be copied except for the dates. The copied meet will be created as a draft."
      confirmLabel="Create copy"
      onClose={onClose}
      onConfirm={handleClone}
      isLoading={isLoading}
      isSubmitting={isSubmitting}
      confirmDisabled={isMeetLoading || Boolean(meetError) || !trimmedName}
    >
      {error ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      ) : null}
      {meetError ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          {meetError}
        </Alert>
      ) : null}
      <TextField
        label="Copied meet name"
        value={name}
        onChange={(event) => {
          setName(event.target.value);
          if (error) {
            setError(null);
          }
        }}
        fullWidth
        sx={{ mt: 2 }}
      />
    </ConfirmActionDialog>
  );
}
