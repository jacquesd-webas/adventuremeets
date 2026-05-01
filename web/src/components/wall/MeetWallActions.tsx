import PostAddOutlinedIcon from "@mui/icons-material/PostAddOutlined";
import { Button, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useState } from "react";
import { useAuth } from "../../context/authContext";
import { useFetchMeet } from "../../hooks/useFetchMeet";
import { MeetWallPhotoComposer } from "./MeetWallPhotoComposer";

type MeetWallActionsProps = {
  meetId: string;
  attendeeId?: string;
};

export function MeetWallActions({ meetId, attendeeId }: MeetWallActionsProps) {
  const [isComposerOpen, setIsComposerOpen] = useState(false);
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

  return (
    <>
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
              aria-label="Add Post"
              variant="outlined"
              size="small"
              startIcon={
                !isMobile ? <PostAddOutlinedIcon fontSize="small" /> : undefined
              }
              onClick={() => {
                setIsComposerOpen(true);
              }}
              sx={mobileButtonSx}
            >
              {isMobile ? (
                <PostAddOutlinedIcon fontSize="small" />
              ) : (
                "Add Post"
              )}
            </Button>
          </Stack>
        ) : null}
      </Stack>
      {isComposerOpen ? (
        <MeetWallPhotoComposer
          meetId={meetId}
          attendeeId={attendeeId}
          allowRating={!isOrganizer}
          onCancel={() => {
            setIsComposerOpen(false);
          }}
          onCreated={() => {
            setIsComposerOpen(false);
          }}
        />
      ) : null}
    </>
  );
}

export default MeetWallActions;
