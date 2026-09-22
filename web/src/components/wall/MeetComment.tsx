import { Typography } from "@mui/material";

type MeetCommentProps = {
  comment?: string;
};

export function MeetComment({ comment }: MeetCommentProps) {
  if (!comment) {
    return null;
  }

  return (
    <Typography
      variant="body1"
      sx={{ whiteSpace: "pre-line" }}
    >
      {comment}
    </Typography>
  );
}

export default MeetComment;
