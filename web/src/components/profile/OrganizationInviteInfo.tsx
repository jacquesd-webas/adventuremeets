import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import {
  Box,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { RoleChip } from "../admin/RoleChip";

type OrganizationInviteInfoProps = {
  invite: {
    id: string;
    email: string;
    roleId: number;
    status: "accepted" | "declined" | "pending";
    token?: string;
    inviteUrl?: string;
  };
  copied: boolean;
  onCopy: () => void;
};

export function OrganizationInviteInfo({
  invite,
  copied,
  onCopy,
}: OrganizationInviteInfoProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  if (isMobile) {
    return (
      <Box
        sx={{
          width: "100%",
          border: 1,
          borderColor: "divider",
          borderRadius: 1,
          px: 1.5,
          py: 1.25,
        }}
      >
        <Stack spacing={1}>
          <Stack direction="row" alignItems="flex-start" spacing={1}>
            <Tooltip
              title={
                invite.status === "accepted"
                  ? "Accepted"
                  : invite.status === "declined"
                    ? "Declined"
                    : "Pending"
              }
            >
              <Box sx={{ display: "flex", alignItems: "center", pt: 0.25 }}>
                {invite.status === "accepted" ? (
                  <CheckCircleIcon fontSize="small" color="success" />
                ) : invite.status === "declined" ? (
                  <CloseIcon fontSize="small" color="error" />
                ) : (
                  <HourglassEmptyIcon fontSize="small" color="disabled" />
                )}
              </Box>
            </Tooltip>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary">
                Email
              </Typography>
              <Typography
                variant="body2"
                fontWeight={700}
                sx={{ wordBreak: "break-word" }}
              >
                {invite.email}
              </Typography>
            </Box>
            <Tooltip title={copied ? "Copied" : "Copy invite link"}>
              <span>
                <IconButton
                  onClick={onCopy}
                  disabled={!invite.token && !invite.inviteUrl}
                  size="small"
                  aria-label={`Copy invite link for ${invite.email}`}
                >
                  {copied ? (
                    <AssignmentTurnedInIcon fontSize="small" />
                  ) : (
                    <ContentCopyIcon fontSize="small" />
                  )}
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Role
            </Typography>
            <Box sx={{ mt: 0.5 }}>
              <RoleChip roleId={invite.roleId} />
            </Box>
          </Box>
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: "100%",
        border: 1,
        borderColor: "divider",
        borderRadius: 1,
        px: 1.5,
        py: 1,
        minWidth: 500,
        display: "grid",
        gridTemplateColumns: "32px minmax(220px, 2fr) 140px 64px",
        columnGap: 1.5,
        alignItems: "center",
      }}
    >
      <Tooltip
        title={
          invite.status === "accepted"
            ? "Accepted"
            : invite.status === "declined"
              ? "Declined"
              : "Pending"
        }
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          {invite.status === "accepted" ? (
            <CheckCircleIcon fontSize="small" color="success" />
          ) : invite.status === "declined" ? (
            <CloseIcon fontSize="small" color="error" />
          ) : (
            <HourglassEmptyIcon fontSize="small" color="disabled" />
          )}
        </Box>
      </Tooltip>
      <Typography variant="body2" fontWeight={700} noWrap>
        {invite.email}
      </Typography>
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <RoleChip roleId={invite.roleId} />
      </Box>
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <Tooltip title={copied ? "Copied" : "Copy invite link"}>
          <span>
            <IconButton
              onClick={onCopy}
              disabled={!invite.token && !invite.inviteUrl}
              size="small"
              aria-label={`Copy invite link for ${invite.email}`}
            >
              {copied ? (
                <AssignmentTurnedInIcon fontSize="small" />
              ) : (
                <ContentCopyIcon fontSize="small" />
              )}
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    </Box>
  );
}
