import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
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
  config?: Record<string, any>;
  value: string | null;
};

type OrganizerMetaEditDialogProps = {
  open: boolean;
  onClose: () => void;
  meetId: string;
  attendeeId: string;
  metaValues: AttendeeMetaValue[];
  hasIndemnity?: boolean;
  indemnityAccepted?: boolean;
};

export function OrganizerMetaEditDialog({
  open,
  onClose,
  meetId,
  attendeeId,
  metaValues,
  hasIndemnity = false,
  indemnityAccepted = false,
}: OrganizerMetaEditDialogProps) {
  const api = useApi();
  const queryClient = useQueryClient();
  const { error, success } = useNotistack();
  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const [indemnityValue, setIndemnityValue] = useState(false);
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
    setIndemnityValue(Boolean(indemnityAccepted));
  }, [open, metaValues, indemnityAccepted]);

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
      const updatePayload: Record<string, any> = { metaValues: payload };
      if (hasIndemnity) {
        updatePayload.indemnityAccepted = indemnityValue;
      }
      await api.patch(`/meets/${meetId}/attendees/${attendeeId}`, updatePayload);
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
            {hasIndemnity ? (
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
              >
                <Typography variant="body2">Indemnity accepted</Typography>
                <Switch
                  checked={indemnityValue}
                  onChange={(event) => setIndemnityValue(event.target.checked)}
                />
              </Stack>
            ) : null}
            {orderedFields.map((field) => {
              const value = values[field.definitionId];
              if (
                field.fieldType === "checkbox" ||
                field.fieldType === "switch"
              ) {
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
              if (field.fieldType === "select") {
                const options = Array.isArray(field.config?.options)
                  ? field.config?.options
                  : [];
                return (
                  <TextField
                    key={field.definitionId}
                    select
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
                  >
                    <MenuItem value="">Select an option</MenuItem>
                    {options.map((option: string) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                );
              }
              return (
                <TextField
                  key={field.definitionId}
                  label={field.label}
                  required={Boolean(field.required)}
                  value={typeof value === "string" ? value : ""}
                  type={field.fieldType === "number" ? "number" : "text"}
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
