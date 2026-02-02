import { Button, FormControlLabel, IconButton, Paper, Stack, Switch, TextField, Typography } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { QuestionField, StepProps } from "./CreateMeetState";

export const QuestionsStep = ({ state, setState }: StepProps) => {
  const addField = (type: QuestionField["type"]) => {
    const newField: QuestionField = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
      type,
      label: "",
      optionsInput: ""
    };
    if (type === "select") {
      newField.options = [];
    }
    setState((prev) => ({ ...prev, questions: [...prev.questions, newField] }));
  };

  const updateField = (id: string, updates: Partial<QuestionField>) => {
    setState((prev) => ({
      ...prev,
      questions: prev.questions.map((q) => (q.id === id ? { ...q, ...updates } : q))
    }));
  };

  const removeField = (id: string) => {
    setState((prev) => ({ ...prev, questions: prev.questions.filter((q) => q.id !== id) }));
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1}>
        <Button variant="outlined" onClick={() => addField("text")}>
          Add textfield
        </Button>
        <Button variant="outlined" onClick={() => addField("select")}>
          Add select
        </Button>
        <Button variant="outlined" onClick={() => addField("switch")}>
          Add switch
        </Button>
        <Button variant="outlined" onClick={() => addField("checkbox")}>
          Add checkbox
        </Button>
      </Stack>
      <Stack spacing={2}>
        {state.questions.map((field) => (
          <Paper key={field.id} variant="outlined" sx={{ p: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="subtitle1" fontWeight={700}>
                {field.type.charAt(0).toUpperCase() + field.type.slice(1)} field
              </Typography>
              <IconButton onClick={() => removeField(field.id)} size="small">
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Stack>
            <Stack spacing={1.5}>
              <TextField
                label="Label"
                placeholder="What should the user see?"
                value={field.label}
                onChange={(e) => updateField(field.id, { label: e.target.value })}
                fullWidth
              />
              {field.type === "select" && (
                <TextField
                  label="Options (comma separated)"
                  placeholder="e.g. Beginner, Intermediate, Advanced"
                  value={field.optionsInput ?? (field.options?.join(", ") || "")}
                  onChange={(e) =>
                    updateField(field.id, {
                      optionsInput: e.target.value,
                      options: e.target.value
                        .split(",")
                        .map((o) => o.trim())
                        .filter(Boolean)
                    })
                  }
                  fullWidth
                />
              )}
              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(field.required)}
                    onChange={(e) => updateField(field.id, { required: e.target.checked })}
                  />
                }
                label="Required"
              />
            </Stack>
          </Paper>
        ))}
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          The form will already have the following inputs:
          <br />
          <br />
          • Name
          <br />
          • Email
          <br />
          • Phone number
          <br />
          <br />
          You can add more questions using the buttons above.
        </Typography>
      </Stack>
    </Stack>
  );
};
