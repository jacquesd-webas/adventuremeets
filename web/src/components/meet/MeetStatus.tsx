import { Chip, useTheme } from "@mui/material";
import { useMeetStatusLookup } from "../../hooks/useFetchMeetStatuses";
import MeetStatusEnum from "../../types/MeetStatusEnum";

type MeetStatusProps = {
  statusId?: number | null;
  fallbackLabel?: string;
};

export function MeetStatus({
  statusId,
  fallbackLabel = "Scheduled",
}: MeetStatusProps) {
  const theme = useTheme();
  const { getName } = useMeetStatusLookup();
  const name = getName(statusId, fallbackLabel);

  // Prefer id-based mapping to avoid label mismatch
  let color: "default" | "primary" | "success" | "error" | "warning" =
    "primary";
  switch (statusId) {
    case MeetStatusEnum.Draft:
      color = "default";
      break;
    case MeetStatusEnum.Published:
      color = "success";
      break;
    case MeetStatusEnum.Open:
      color = "primary";
      break;
    case MeetStatusEnum.Closed:
      color = "success";
      break;
    case MeetStatusEnum.Cancelled:
      color = "error";
      break;
    case MeetStatusEnum.Postponed:
      color = "warning";
      break;
    case MeetStatusEnum.Completed:
      color = "success";
      break;
    default: {
      const normalized = name.toLowerCase();
      if (normalized === "draft") color = "default";
      if (normalized === "published") color = "success";
      if (normalized === "open") color = "primary";
      if (normalized === "closed") color = "success";
      if (normalized === "completed") color = "success";
      if (normalized === "cancelled") color = "error";
      if (normalized === "postponed") color = "warning";
      break;
    }
  }

  const isDark = theme.palette.mode === "dark";
  const isClosed =
    statusId === MeetStatusEnum.Closed || name.toLowerCase() === "closed";
  const isCompleted =
    statusId === MeetStatusEnum.Completed || name.toLowerCase() === "completed";
  const closedChipColor = "#7e57c2";
  const completedChipColor = theme.palette.grey[600];
  const chipColor =
    color === "default"
      ? theme.palette.text.secondary
      : theme.palette[color].main;

  return (
    <Chip
      size="small"
      label={name}
      color={color}
      variant={isDark ? "outlined" : "filled"}
      sx={{
        ...(isDark
          ? {
              color: chipColor,
              borderColor: chipColor,
              backgroundColor: "transparent",
            }
          : {}),
        ...(isClosed
          ? isDark
            ? {
                color: closedChipColor,
                borderColor: closedChipColor,
                backgroundColor: "transparent",
              }
            : {
                color: "#fff",
                backgroundColor: closedChipColor,
                "& .MuiChip-label": {
                  color: "#fff",
                },
              }
          : {}),
        ...(isCompleted
          ? isDark
            ? {
                color: completedChipColor,
                borderColor: completedChipColor,
                backgroundColor: "transparent",
              }
            : {
                color: "#fff",
                backgroundColor: completedChipColor,
                "& .MuiChip-label": {
                  color: "#fff",
                },
              }
          : {}),
      }}
    />
  );
}
