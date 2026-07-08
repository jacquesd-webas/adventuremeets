import { Rating } from "@mui/material";

type MeetRatingProps = {
  stars?: number;
};

export function MeetRating({ stars }: MeetRatingProps) {
  if (!stars) {
    return null;
  }

  return <Rating value={stars} precision={1} readOnly />;
}

export default MeetRating;
