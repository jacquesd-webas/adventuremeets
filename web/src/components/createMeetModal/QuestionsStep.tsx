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
import { HelpBanner } from "./HelpBanner";
import { useFetchOrganization } from "../../hooks/useFetchOrganization";

export const QuestionsStep = ({
  state,
  setState,
  disabled = false,
  isHelpEnabled = false,
  isHelpBannerDismissed = false,
  onDismissHelpBanner,
}: StepProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { data: organization } = useFetchOrganization(
    state.organizationId || undefined,
  );
  const customField1Label = organization?.customField1Name?.trim() || "";
  const customField2Label = organization?.customField2Name?.trim() || "";

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
    <Box sx={{ position: "relative" }}>
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
            The form will already have <strong>Name</strong>. Use the switches
            below to mark the standard attendee fields as required, then add any
            extra questions using the buttons above or import them from a
            template.
          </i>
        </Typography>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={1.25}>
            <Typography variant="subtitle1" fontWeight={700}>
              Standard fields
            </Typography>
            <Box
              sx={{
                display: "grid",
                gap: 1,
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              }}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={state.requireEmail}
                    disabled={disabled}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        requireEmail: e.target.checked,
                      }))
                    }
                  />
                }
                label="E-mail address"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={state.requirePhone}
                    disabled={disabled}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        requirePhone: e.target.checked,
                      }))
                    }
                  />
                }
                label="Phone number"
              />
              {customField1Label ? (
                <FormControlLabel
                  control={
                    <Switch
                      checked={state.requireOrg1}
                      disabled={disabled}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          requireOrg1: e.target.checked,
                        }))
                      }
                    />
                  }
                  label={customField1Label}
                />
              ) : null}
              {customField2Label ? (
                <FormControlLabel
                  control={
                    <Switch
                      checked={state.requireOrg2}
                      disabled={disabled}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          requireOrg2: e.target.checked,
                        }))
                      }
                    />
                  }
                  label={customField2Label}
                />
              ) : null}
            </Box>
          </Stack>
        </Paper>
        {isHelpEnabled ? (
          <Typography variant="body2" color="text.secondary">
            Use text for open answers, select for one choice from a list, switch
            for a yes or no answer, and checkbox for a simple confirmation.
          </Typography>
        ) : null}
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
                  {field.type.charAt(0).toUpperCase() + field.type.slice(1)}{" "}
                  field
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
                      state.questions[state.questions.length - 1]?.id ===
                        field.id
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
                  helperText={
                    isHelpEnabled
                      ? "This is the exact question or prompt your attendee will read."
                      : undefined
                  }
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
                    helperText={
                      isHelpEnabled
                        ? "Separate each option with a comma. Attendees will choose one of these values."
                        : undefined
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
                {isHelpEnabled ? (
                  <Typography variant="body2" color="text.secondary">
                    Required means the attendee must answer before submitting.
                    Include in reports means organisers can use this answer in
                    exports and reporting later.
                  </Typography>
                ) : null}
              </Stack>
            </Paper>
          ))}
        </Stack>
      </Stack>
      {isHelpEnabled && !isHelpBannerDismissed ? (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            p: 1,
            bgcolor: "rgba(255,255,255,0.72)",
            backdropFilter: "blur(1px)",
          }}
        >
          <Box sx={{ width: "100%", maxWidth: 760 }}>
            <HelpBanner
              message={
                <>
                  Here you can add questions you want attendees to answer as
                  part of their application.
                  <br />
                  <br />
                  The form will always include Name, and it is recommended to
                  have email and phone as well to enable you to communicate with
                  attendees.
                  <br />
                  <br />
                  You can also import questions from a template if your
                  organisation has some set up already. If you use the templates
                  it helps with consistency which allows attendees to auto-fill
                  their answers in future meets.
                </>
              }
              onDismiss={onDismissHelpBanner || (() => undefined)}
            />
          </Box>
        </Box>
      ) : null}
    </Box>
  );
};
