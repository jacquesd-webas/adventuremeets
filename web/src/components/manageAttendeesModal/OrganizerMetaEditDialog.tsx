import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useApi } from "../../hooks/useApi";
import { useNotistack } from "../../hooks/useNotistack";
import { useQueryClient } from "@tanstack/react-query";

type AttendeeMetaValue = {
  definitionId: string;
  label: string;
  fieldType: string;
  required?: boolean;
  position?: number;
  value: string | null;
};

type OrganizerMetaEditDialogProps = {
  open: boolean;
  onClose: () => void;
  meetId: string;
  attendeeId: string;
  metaValues: AttendeeMetaValue[];
};

export function OrganizerMetaEditDialog({
  open,
  onClose,
  meetId,
  attendeeId,
  metaValues,
}: OrganizerMetaEditDialogProps) {
  const api = useApi();
  const queryClient = useQueryClient();
  const { error, success } = useNotistack();
  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const [isSaving, setIsSaving] = useState(false);

  const orderedFields = useMemo(() => {
    return [...metaValues].sort((a, b) => {
      const aPos = a.position ?? 0;
      const bPos = b.position ?? 0;
      return aPos - bPos;
    });
  }, [metaValues]);

  useEffect(() => {
    if (!open) return;
    const next: Record<string, string | boolean> = {};
    metaValues.forEach((field) => {
      if (field.fieldType === "checkbox" || field.fieldType === "switch") {
        next[field.definitionId] = field.value === "true";
      } else {
        next[field.definitionId] = field.value ?? "";
      }
    });
    setValues(next);
  }, [open, metaValues]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = orderedFields.map((field) => ({
        definitionId: field.definitionId,
        value:
          field.fieldType === "checkbox" || field.fieldType === "switch"
            ? String(Boolean(values[field.definitionId]))
            : String(values[field.definitionId] ?? ""),
      }));
      await api.patch(`/meets/${meetId}/attendees/${attendeeId}`, {
        metaValues: payload,
      });
      await queryClient.invalidateQueries({
        queryKey: ["meet-attendees", meetId],
      });
      success("Responses updated");
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      error(`Unable to update responses: ${message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Edit organiser responses</DialogTitle>
      <DialogContent dividers>
        {orderedFields.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No responses to edit.
          </Typography>
        ) : (
          <Stack spacing={2}>
            {orderedFields.map((field) => {
              const value = values[field.definitionId];
              if (field.fieldType === "checkbox" || field.fieldType === "switch") {
                return (
                  <Stack
                    key={field.definitionId}
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Typography variant="body2">
                      {field.label}
                      {field.required ? " *" : ""}
                    </Typography>
                    <Switch
                      checked={Boolean(value)}
                      onChange={(event) =>
                        setValues((prev) => ({
                          ...prev,
                          [field.definitionId]: event.target.checked,
                        }))
                      }
                    />
                  </Stack>
                );
              }
              return (
                <TextField
                  key={field.definitionId}
                  label={field.label}
                  required={Boolean(field.required)}
                  value={typeof value === "string" ? value : ""}
                  onChange={(event) =>
                    setValues((prev) => ({
                      ...prev,
                      [field.definitionId]: event.target.value,
                    }))
                  }
                  fullWidth
                />
              );
            })}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={isSaving}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
