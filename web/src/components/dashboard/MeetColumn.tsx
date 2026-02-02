import { Paper, Stack, Typography } from "@mui/material";
import Meet from "../../models/MeetModel";
import { MeetCard } from "./MeetCard";
import { PendingAction } from "../MeetActionsDialogs";

type MeetColumnProps = {
  title: string;
  meets: Meet[];
  statusFallback: string;
  setSelectedMeetId: (id: string | null) => void;
  setPendingAction: (action: PendingAction | null) => void;
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
  return (
    <>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        {title}
      </Typography>
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
