import AddCommentOutlinedIcon from "@mui/icons-material/AddCommentOutlined";
import AddPhotoAlternateOutlinedIcon from "@mui/icons-material/AddPhotoAlternateOutlined";
import StarOutlineOutlinedIcon from "@mui/icons-material/StarOutlineOutlined";
import { Button, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import { ChangeEvent, useRef, useState } from "react";
import { useAuth } from "../../context/authContext";
import { useFetchMeet } from "../../hooks/useFetchMeet";
import { MeetWallCommentComposer } from "./MeetWallCommentComposer";
import { MeetWallPhotoComposer } from "./MeetWallPhotoComposer";
import { MeetWallRatingComposer } from "./MeetWallRatingComposer";

type MeetWallActionsProps = {
  meetId: string;
  attendeeId?: string;
};

export function MeetWallActions({ meetId, attendeeId }: MeetWallActionsProps) {
  const [composer, setComposer] = useState<"comment" | "photo" | "rating" | null>(
    null,
  );
  const [selectedPhotoFiles, setSelectedPhotoFiles] = useState<File[]>([]);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { user } = useAuth();
  const { data: meet } = useFetchMeet(meetId);
  const canShowActionButtons = Boolean(user || attendeeId);
  const isOrganizer = Boolean(
    user?.id && meet?.organizerId && user.id === meet.organizerId,
  );
  const mobileButtonSx = isMobile
    ? {
        minWidth: 0,
        px: 1.25,
      }
    : undefined;

  const resetPhotoComposer = () => {
    setSelectedPhotoFiles([]);
    setComposer(null);
  };

  const handlePhotoSelection = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []).filter((file) =>
      file.type.startsWith("image/"),
    );
    event.target.value = "";
    if (!files.length) {
      return;
    }
    setSelectedPhotoFiles(files);
    setComposer("photo");
  };

  return (
    <>
      <input
        ref={photoInputRef}
        hidden
        multiple
        accept="image/*"
        type="file"
        onChange={handlePhotoSelection}
      />
      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
        useFlexGap
        flexWrap="wrap"
      >
        <Typography variant="h6" fontWeight={700}>
          Meet Feedback
        </Typography>
        {canShowActionButtons ? (
          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            flexWrap="wrap"
            alignItems="center"
          >
            <Button
              aria-label="Add Comment"
              variant="outlined"
              size="small"
              startIcon={
                !isMobile ? <AddCommentOutlinedIcon fontSize="small" /> : undefined
              }
              onClick={() => {
                setComposer("comment");
              }}
              sx={mobileButtonSx}
            >
              {isMobile ? (
                <AddCommentOutlinedIcon fontSize="small" />
              ) : (
                "Add Comment"
              )}
            </Button>
            <Button
              aria-label="Add Photos"
              variant="outlined"
              size="small"
              startIcon={
                !isMobile ? (
                  <AddPhotoAlternateOutlinedIcon fontSize="small" />
                ) : undefined
              }
              onClick={() => {
                photoInputRef.current?.click();
              }}
              sx={mobileButtonSx}
            >
              {isMobile ? (
                <AddPhotoAlternateOutlinedIcon fontSize="small" />
              ) : (
                "Add Photos"
              )}
            </Button>
            {!isOrganizer ? (
              <Button
                aria-label="Rate Meet"
                variant="outlined"
                size="small"
                startIcon={
                  !isMobile ? <StarOutlineOutlinedIcon fontSize="small" /> : undefined
                }
                onClick={() => {
                  setComposer("rating");
                }}
                sx={mobileButtonSx}
              >
                {isMobile ? (
                  <StarOutlineOutlinedIcon fontSize="small" />
                ) : (
                  "Rate Meet"
                )}
              </Button>
            ) : null}
          </Stack>
        ) : null}
      </Stack>
      {composer === "comment" ? (
        <MeetWallCommentComposer
          meetId={meetId}
          attendeeId={attendeeId}
          onCancel={() => {
            setComposer(null);
          }}
          onCreated={() => {
            setComposer(null);
          }}
        />
      ) : null}
      {composer === "photo" ? (
        <MeetWallPhotoComposer
          meetId={meetId}
          attendeeId={attendeeId}
          initialFiles={selectedPhotoFiles}
          onCancel={() => {
            resetPhotoComposer();
          }}
          onCreated={() => {
            resetPhotoComposer();
          }}
        />
      ) : null}
      {composer === "rating" ? (
        <MeetWallRatingComposer
          meetId={meetId}
          attendeeId={attendeeId}
          onCancel={() => {
            setComposer(null);
          }}
          onCreated={() => {
            setComposer(null);
          }}
        />
      ) : null}
    </>
  );
}

export default MeetWallActions;
