import { Button, Stack, TextField } from "@mui/material";
import { FormEvent, useState } from "react";

type MeetWallCommentEditorProps = {
  initialComment: string;
  isSaving: boolean;
  onCancel: () => void;
  onSave: (comment: string) => Promise<void>;
};

export function MeetWallCommentEditor({
  initialComment,
  isSaving,
  onCancel,
  onSave,
}: MeetWallCommentEditorProps) {
  const [comment, setComment] = useState(initialComment);
  const trimmedComment = comment.trim();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!trimmedComment) {
      return;
    }

    await onSave(trimmedComment);
  };

  return (
    <Stack
      component="form"
      spacing={1.5}
      onSubmit={handleSubmit}
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
        p: 2,
        backgroundColor: "background.paper",
      }}
    >
      <TextField
        multiline
        minRows={3}
        label="Edit Comment"
        value={comment}
        onChange={(event) => {
          setComment(event.target.value);
        }}
        autoFocus
        fullWidth
      />
      <Stack direction="row" spacing={1} justifyContent="flex-end">
        <Button variant="text" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={!trimmedComment || isSaving}
        >
          Save Comment
        </Button>
      </Stack>
    </Stack>
  );
}

export default MeetWallCommentEditor;
