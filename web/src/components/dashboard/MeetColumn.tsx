import { Paper, Stack, Typography } from "@mui/material";
import Meet from "../../types/MeetModel";
import { MeetCard } from "./MeetCard";
import { useAuth } from "../../context/authContext";
import MeetActionsEnum from "../../types/MeetActionsEnum";

type MeetColumnProps = {
  title: string;
  meets: Meet[];
  statusFallback: string;
  setSelectedMeetId: (id: string | null) => void;
  setPendingAction: (action: MeetActionsEnum | null) => void;
  isLoading?: boolean;
  getStatusLabel: (statusId?: number, fallback?: string) => string;
};

export function MeetColumn({
  title,
  meets,
  statusFallback,
  setSelectedMeetId,
  setPendingAction,
  isLoading = false,
  getStatusLabel,
}: MeetColumnProps) {
  const { user } = useAuth();
  return (
    <>
      <Paper
        variant="outlined"
        sx={{
          mb: 1,
          px: 2,
          py: 1,
          borderRadius: "5px",
          backgroundColor: "rgba(255, 255, 255, 0.70)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderColor: "divider",
        }}
      >
        <Typography variant="subtitle1" fontWeight={600}>
          {title}
        </Typography>
      </Paper>
      <Stack spacing={2}>
        {isLoading ? (
          <Typography variant="body2" color="text.secondary">
            Loading meets...
          </Typography>
        ) : meets.length ? (
          meets.map((meet) => (
            <MeetCard
              key={meet.id}
              meet={meet}
              isOrganizer={meet.organizerId === user?.id}
              statusLabel={getStatusLabel(meet.statusId, statusFallback)}
              onClick={() => {}}
              setSelectedMeetId={setSelectedMeetId}
              setPendingAction={setPendingAction}
            />
          ))
        ) : (
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              No {title.toLowerCase()} yet.
            </Typography>
          </Paper>
        )}
      </Stack>
    </>
  );
}
