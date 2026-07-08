import { Button, Rating, Stack, TextField, Typography } from "@mui/material";
import { FormEvent, useState } from "react";
import { useCreateWallItem } from "../../hooks/useCreateWallItem";
import { useNotistack } from "../../hooks/useNotistack";

type MeetWallRatingComposerProps = {
  meetId: string;
  attendeeId?: string;
  onCancel: () => void;
  onCreated: () => void;
};

export function MeetWallRatingComposer({
  meetId,
  attendeeId,
  onCancel,
  onCreated,
}: MeetWallRatingComposerProps) {
  const [stars, setStars] = useState<number | null>(0);
  const [comment, setComment] = useState("");
  const { createWallItemAsync, isLoading } = useCreateWallItem();
  const notice = useNotistack();

  const trimmedComment = comment.trim();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!stars) {
      return;
    }

    try {
      await createWallItemAsync({
        meetId,
        attendeeId,
        stars,
        comment: trimmedComment || undefined,
      });
      setStars(0);
      setComment("");
      notice.success("Rating added");
      onCreated();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to add rating";
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
      <Stack spacing={0.75}>
        <Typography variant="subtitle2">Add Rating</Typography>
        <Rating
          name="meet-wall-rating"
          value={stars}
          onChange={(_event, value) => {
            setStars(value);
          }}
        />
      </Stack>
      <TextField
        multiline
        minRows={3}
        label="Comment"
        placeholder="Add a comment with your rating"
        value={comment}
        onChange={(event) => {
          setComment(event.target.value);
        }}
        fullWidth
      />
      <Stack direction="row" spacing={1} justifyContent="flex-end">
        <Button variant="text" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={!stars || isLoading}>
          Post Rating
        </Button>
      </Stack>
    </Stack>
  );
}

export default MeetWallRatingComposer;
