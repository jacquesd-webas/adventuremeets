import {
  Box,
  Button,
  FormControlLabel,
  IconButton,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { QuestionField, StepProps } from "./CreateMeetState";
import { SelectTemplate } from "./SelectTemplate";

export const QuestionsStep = ({
  state,
  setState,
  disabled = false,
}: StepProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const addField = (type: QuestionField["type"]) => {
    const newField: QuestionField = {
      id: crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2),
      type,
      label: "",
      optionsInput: "",
      includeInReports: false,
    };
    if (type === "select") {
      newField.options = [];
    }
    setState((prev) => ({ ...prev, questions: [...prev.questions, newField] }));
  };

  const updateField = (id: string, updates: Partial<QuestionField>) => {
    setState((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === id ? { ...q, ...updates } : q,
      ),
    }));
  };

  const removeField = (id: string) => {
    setState((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.id !== id),
    }));
  };

  const moveField = (id: string, direction: "up" | "down") => {
    setState((prev) => {
      const index = prev.questions.findIndex((q) => q.id === id);
      if (index === -1) return prev;
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.questions.length) return prev;
      const updated = [...prev.questions];
      [updated[index], updated[targetIndex]] = [
        updated[targetIndex],
        updated[index],
      ];
      return { ...prev, questions: updated };
    });
  };

  return (
    <Stack spacing={2}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.25}
        alignItems={{ xs: "stretch", sm: "center" }}
      >
        <Box sx={{ flexShrink: 0, width: { xs: "100%", sm: "auto" } }}>
          <SelectTemplate
            organizationId={state.organizationId || undefined}
            disabled={disabled}
            onApply={(questions) =>
              setState((prev) => ({ ...prev, questions }))
            }
          />
        </Box>
        <Box
          sx={{
            display: "grid",
            gap: 1,
            flex: 1,
            gridTemplateColumns: {
              xs: "repeat(2, minmax(0, 1fr))",
              sm: "repeat(4, minmax(0, 1fr))",
            },
          }}
        >
          <Button
            variant="outlined"
            onClick={() => addField("text")}
            disabled={disabled}
            size={isMobile ? "small" : "medium"}
            sx={{ width: "100%" }}
          >
            Textfield
          </Button>
          <Button
            variant="outlined"
            onClick={() => addField("select")}
            disabled={disabled}
            size={isMobile ? "small" : "medium"}
            sx={{ width: "100%" }}
          >
            Select
          </Button>
          <Button
            variant="outlined"
            onClick={() => addField("switch")}
            disabled={disabled}
            size={isMobile ? "small" : "medium"}
            sx={{ width: "100%" }}
          >
            Switch
          </Button>
          <Button
            variant="outlined"
            onClick={() => addField("checkbox")}
            disabled={disabled}
            size={isMobile ? "small" : "medium"}
            sx={{ width: "100%" }}
          >
            Checkbox
          </Button>
        </Box>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        <i>
          The form will already have{" "}
          <strong>Name, Email, and Phone number</strong>. You can add more
          questions using the buttons above or import them from a template.
        </i>
      </Typography>
      <Stack spacing={2}>
        {state.questions.map((field) => (
          <Paper key={field.id} variant="outlined" sx={{ p: 2 }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              mb={1}
            >
              <Typography variant="subtitle1" fontWeight={700}>
                {field.type.charAt(0).toUpperCase() + field.type.slice(1)} field
              </Typography>
              <Stack direction="row" spacing={0.5}>
                <IconButton
                  onClick={() => moveField(field.id, "up")}
                  size="small"
                  disabled={disabled || state.questions[0]?.id === field.id}
                >
                  <ArrowUpwardIcon fontSize="small" />
                </IconButton>
                <IconButton
                  onClick={() => moveField(field.id, "down")}
                  size="small"
                  disabled={
                    disabled ||
                    state.questions[state.questions.length - 1]?.id === field.id
                  }
                >
                  <ArrowDownwardIcon fontSize="small" />
                </IconButton>
                <IconButton
                  onClick={() => removeField(field.id)}
                  size="small"
                  disabled={disabled}
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
                  updateField(field.id, { label: e.target.value })
                }
                fullWidth
                disabled={disabled}
              />
              {field.type === "select" && (
                <TextField
                  label="Options (comma separated)"
                  placeholder="e.g. Beginner, Intermediate, Advanced"
                  value={
                    field.optionsInput ?? (field.options?.join(", ") || "")
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
                  disabled={disabled}
                />
              )}
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                alignItems={{ xs: "flex-start", sm: "center" }}
              >
                <FormControlLabel
                  control={
                    <Switch
                      checked={Boolean(field.required)}
                      disabled={disabled}
                      onChange={(e) =>
                        updateField(field.id, { required: e.target.checked })
                      }
                    />
                  }
                  label="Required"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={Boolean(field.includeInReports)}
                      disabled={disabled}
                      onChange={(e) =>
                        updateField(field.id, {
                          includeInReports: e.target.checked,
                        })
                      }
                    />
                  }
                  label="Include in reports"
                />
              </Stack>
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Stack>
  );
};
