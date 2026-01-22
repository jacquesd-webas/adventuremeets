import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useEffect, useState } from "react";
import { useCreateTemplate } from "../../hooks/useCreateTemplate";
import { useUpdateTemplate } from "../../hooks/useUpdateTemplate";
import { useFetchOrganizationTemplate } from "../../hooks/useFetchOrganizationTemplate";
import { TemplateMetaDefinition } from "../../types/TemplateModel";

type CreateOrEditTemplateModalProps = {
  open: boolean;
  organizationId: string;
  templateId?: string | null;
  onClose: () => void;
};

type TemplateQuestionField = {
  id: string;
  type: "text" | "select" | "switch" | "checkbox";
  label: string;
  required?: boolean;
  options?: string[];
  fieldKey?: string;
  optionsInput?: string;
};

export function CreateOrEditTemplateModal({
  open,
  organizationId,
  templateId,
  onClose,
}: CreateOrEditTemplateModalProps) {
  const { createTemplateAsync, isLoading } = useCreateTemplate();
  const { updateTemplateAsync, isLoading: isUpdating } = useUpdateTemplate();
  const { data: existingTemplate, isLoading: isLoadingTemplate } =
    useFetchOrganizationTemplate(organizationId, templateId || undefined);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<TemplateQuestionField[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (templateId && existingTemplate) {
      setName(existingTemplate.name || "");
      setDescription(existingTemplate.description || "");
      setQuestions(
        mapDefinitionsToQuestions(existingTemplate.metaDefinitions || [])
      );
    } else if (templateId && !existingTemplate) {
      setName("");
      setDescription("");
      setQuestions([]);
    } else if (!templateId) {
      setName("");
      setDescription("");
      setQuestions([]);
    }
    setError(null);
  }, [open, templateId, existingTemplate]);

  const addField = (type: TemplateQuestionField["type"]) => {
    const newField: TemplateQuestionField = {
      id: crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2),
      type,
      label: "",
      optionsInput: "",
    };
    if (type === "select") {
      newField.options = [];
    }
    setQuestions((prev) => [...prev, newField]);
  };

  const updateField = (id: string, updates: Partial<TemplateQuestionField>) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...updates } : q))
    );
  };

  const removeField = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setError(null);
    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      metaDefinitions: questions.map((question, index) => ({
        id: question.id,
        fieldKey: question.fieldKey || question.id || `field_${index + 1}`,
        label: question.label,
        fieldType: question.type,
        required: Boolean(question.required),
        config:
          question.type === "select" ? { options: question.options ?? [] } : {},
      })),
    };
    try {
      if (templateId) {
        await updateTemplateAsync({
          organizationId,
          templateId,
          ...payload,
        });
      } else {
        await createTemplateAsync({
          organizationId,
          ...payload,
        });
      }
      onClose();
    } catch (err: any) {
      setError(
        err?.message ||
          (templateId
            ? "Failed to update template"
            : "Failed to create template")
      );
    }
  };

  const dialogTitle = templateId ? "Edit template" : "Create template";
  const actionLabel = templateId ? "Save" : "Create";
  const busy = isLoading || isUpdating || isLoadingTemplate;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{dialogTitle}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && <span style={{ color: "#d32f2f" }}>{error}</span>}
          <TextField
            label="Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            fullWidth
            required
          />
          <TextField
            label="Description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            fullWidth
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            <i>
              The template will already have{" "}
              <strong>Name, Email and Phone number</strong>. You can add
              additional questions below.
            </i>
          </Typography>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} sx={{ width: "100%" }}>
              <Button
                variant="outlined"
                onClick={() => addField("text")}
                sx={{ flex: 1 }}
              >
                Textfield
              </Button>
              <Button
                variant="outlined"
                onClick={() => addField("select")}
                sx={{ flex: 1 }}
              >
                Select
              </Button>
              <Button
                variant="outlined"
                onClick={() => addField("switch")}
                sx={{ flex: 1 }}
              >
                Switch
              </Button>
              <Button
                variant="outlined"
                onClick={() => addField("checkbox")}
                sx={{ flex: 1 }}
              >
                Checkbox
              </Button>
            </Stack>
            <Stack spacing={2}>
              {questions.map((field) => (
                <Paper key={field.id} variant="outlined" sx={{ p: 2 }}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={1}
                  >
                    <Typography variant="subtitle1" fontWeight={700}>
                      {field.type.charAt(0).toUpperCase() + field.type.slice(1)}{" "}
                      field
                    </Typography>
                    <IconButton
                      onClick={() => removeField(field.id)}
                      size="small"
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                  <Stack spacing={1.5}>
                    <TextField
                      label="Label"
                      placeholder="What should the user see?"
                      value={field.label}
                      onChange={(e) =>
                        updateField(field.id, { label: e.target.value })
                      }
                      fullWidth
                    />
                    {field.type === "select" && (
                      <TextField
                        label="Options (comma separated)"
                        placeholder="e.g. Beginner, Intermediate, Advanced"
                        value={
                          field.optionsInput ??
                          (field.options?.join(", ") || "")
                        }
                        onChange={(e) =>
                          updateField(field.id, {
                            optionsInput: e.target.value,
                            options: e.target.value
                              .split(",")
                              .map((o) => o.trim())
                              .filter(Boolean),
                          })
                        }
                        fullWidth
                      />
                    )}
                    <FormControlLabel
                      control={
                        <Switch
                          checked={Boolean(field.required)}
                          onChange={(e) =>
                            updateField(field.id, {
                              required: e.target.checked,
                            })
                          }
                        />
                      }
                      label="Required"
                    />
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={busy}>
          {busy ? "Saving..." : actionLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

const mapDefinitionsToQuestions = (
  definitions: TemplateMetaDefinition[]
): TemplateQuestionField[] =>
  definitions.map((definition) => {
    const fieldType = ["text", "select", "switch", "checkbox"].includes(
      definition.fieldType
    )
      ? (definition.fieldType as TemplateQuestionField["type"])
      : "text";
    const fallbackId =
      definition.id ||
      (typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2));
    return {
      id: fallbackId,
      type: fieldType,
      label: definition.label || "",
      required: Boolean(definition.required),
      options:
        fieldType === "select"
          ? (definition.config?.options as string[]) || []
          : undefined,
      optionsInput:
        fieldType === "select"
          ? ((definition.config?.options as string[]) || []).join(", ")
          : "",
      fieldKey: definition.fieldKey,
    };
  });
