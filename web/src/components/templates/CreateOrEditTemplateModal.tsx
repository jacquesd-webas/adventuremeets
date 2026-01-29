import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
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
  const [section, setSection] = useState<
    "basic" | "questions" | "responses" | "indemnity"
  >("basic");

  useEffect(() => {
    if (!open) return;
    if (templateId && existingTemplate) {
      setName(existingTemplate.name || "");
      setDescription(existingTemplate.description || "");
      setQuestions(
        mapDefinitionsToQuestions(existingTemplate.metaDefinitions || [])
      );
      setSection("basic");
    } else if (templateId && !existingTemplate) {
      setName("");
      setDescription("");
      setQuestions([]);
      setSection("basic");
    } else if (!templateId) {
      setName("");
      setDescription("");
      setQuestions([]);
      setSection("basic");
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

  const buildFieldKey = (label?: string) => {
    const cleaned = (label || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    return cleaned;
  };

  const updateField = (id: string, updates: Partial<TemplateQuestionField>) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...updates } : q))
    );
  };

  const removeField = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const moveField = (id: string, direction: "up" | "down") => {
    setQuestions((prev) => {
      const index = prev.findIndex((q) => q.id === id);
      if (index === -1) return prev;
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
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
        fieldKey:
          question.fieldKey ||
          buildFieldKey(question.label) ||
          question.id ||
          `field_${index + 1}`,
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
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{ sx: { height: "80vh" } }}
    >
      <DialogTitle>{dialogTitle}</DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} md={3}>
            <List>
              {[
                { key: "basic", label: "Basic Info" },
                { key: "questions", label: "Questions" },
                { key: "responses", label: "Responses" },
                { key: "indemnity", label: "Indemnity" },
              ].map((item) => (
                <ListItemButton
                  key={item.key}
                  selected={section === item.key}
                  onClick={() =>
                    setSection(
                      item.key as "basic" | "questions" | "responses" | "indemnity"
                    )
                  }
                >
                  <ListItemText primary={item.label} />
                </ListItemButton>
              ))}
            </List>
          </Grid>
          <Grid item xs={12} md={9}>
            <Stack spacing={2}>
              {error && <span style={{ color: "#d32f2f" }}>{error}</span>}
              {section === "basic" && (
                <Stack spacing={2}>
                  <Typography variant="h6" fontWeight={700}>
                    Basic Info
                  </Typography>
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
                </Stack>
              )}

              {section === "questions" && (
                <Stack spacing={2}>
                  <Typography variant="h6" fontWeight={700}>
                    Questions
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
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
                      {questions.map((field, index) => (
                        <Paper key={field.id} variant="outlined" sx={{ p: 2 }}>
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            mb={1}
                          >
                            <Typography variant="subtitle1" fontWeight={700}>
                              {field.type.charAt(0).toUpperCase() +
                                field.type.slice(1)}{" "}
                              field
                            </Typography>
                            <Stack
                              direction="row"
                              spacing={0.5}
                              alignItems="center"
                            >
                              <IconButton
                                onClick={() => moveField(field.id, "up")}
                                size="small"
                                disabled={index === 0}
                              >
                                <ArrowUpwardIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                onClick={() => moveField(field.id, "down")}
                                size="small"
                                disabled={index === questions.length - 1}
                              >
                                <ArrowDownwardIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                onClick={() => removeField(field.id)}
                                size="small"
                              >
                                <DeleteOutlineIcon fontSize="small" />
                              </IconButton>
                            </Stack>
                          </Stack>
                          <Stack spacing={1.5}>
                            <TextField
                              label="Label"
                              placeholder="What should the user see?"
                              value={field.label}
                              onChange={(e) =>
                                updateField(field.id, {
                                  label: e.target.value,
                                })
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
              )}

              {section === "responses" && (
                <Stack spacing={2}>
                  <Typography variant="h6" fontWeight={700}>
                    Responses
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Response settings will be available soon.
                  </Typography>
                </Stack>
              )}

              {section === "indemnity" && (
                <Stack spacing={2}>
                  <Typography variant="h6" fontWeight={700}>
                    Indemnity
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Indemnity settings will be available soon.
                  </Typography>
                </Stack>
              )}
            </Stack>
          </Grid>
        </Grid>
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
