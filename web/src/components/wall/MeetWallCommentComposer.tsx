import { Button, Stack, TextField } from "@mui/material";
import { FormEvent, useState } from "react";
import { useCreateWallItem } from "../../hooks/useCreateWallItem";
import { useNotistack } from "../../hooks/useNotistack";

type MeetWallCommentComposerProps = {
  meetId: string;
  attendeeId?: string;
  onCancel: () => void;
  onCreated: () => void;
};

export function MeetWallCommentComposer({
  meetId,
  attendeeId,
  onCancel,
  onCreated,
}: MeetWallCommentComposerProps) {
  const [comment, setComment] = useState("");
  const { createWallItemAsync, isLoading } = useCreateWallItem();
  const notice = useNotistack();

  const trimmedComment = comment.trim();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!trimmedComment) {
      return;
    }

    try {
      await createWallItemAsync({
        meetId,
        attendeeId,
        comment: trimmedComment,
      });
      setComment("");
      notice.success("Comment added");
      onCreated();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to add comment";
      notice.error(message);
    }
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
        label="Add Comment"
        placeholder="Share your thoughts about the meet"
        value={comment}
        onChange={(event) => {
          setComment(event.target.value);
        }}
        autoFocus
        fullWidth
      />
      <Stack direction="row" spacing={1} justifyContent="flex-end">
        <Button variant="text" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={!trimmedComment || isLoading}
        >
          Post Comment
        </Button>
      </Stack>
    </Stack>
  );
}

export default MeetWallCommentComposer;
