import { Paper, Stack, Typography } from "@mui/material";
import Meet from "../../types/MeetModel";
import { MeetCard } from "./MeetCard";
import MeetActionsEnum from "../../types/MeetActionsEnum";
import { defaultPendingAction } from "../../helpers/defaultPendingAction";
import { getMeetPermissions } from "../../helpers/meetPermissions";

type MeetColumnProps = {
  title: string;
  meets: Meet[];
  statusFallback: string;
  currentUserId?: string | null;
  currentOrganizationRole?: string | null;
  setSelectedMeetId: (id: string | null) => void;
  setPendingAction: (action: MeetActionsEnum | null) => void;
  isLoading?: boolean;
  getStatusLabel: (statusId?: number, fallback?: string) => string;
};

export function MeetColumn({
  title,
  meets,
  statusFallback,
  currentUserId,
  currentOrganizationRole,
  setSelectedMeetId,
  setPendingAction,
  isLoading = false,
  getStatusLabel,
}: MeetColumnProps) {
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
          meets.map((meet) => {
            const { canManageMeet, canViewMeet } = getMeetPermissions({
              currentUserId,
              currentOrganizationRole,
              organizerId: meet.organizerId,
            });

            return (
              <MeetCard
                key={meet.id}
                meet={meet}
                canManageMeet={canManageMeet}
                canViewMeet={canViewMeet}
                statusLabel={getStatusLabel(meet.statusId, statusFallback)}
                onClick={() => {
                  setSelectedMeetId(meet.id);
                  setPendingAction(defaultPendingAction(meet.statusId));
                }}
                setSelectedMeetId={setSelectedMeetId}
                setPendingAction={setPendingAction}
              />
            );
          })
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
