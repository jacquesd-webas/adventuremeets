import { Chip } from "@mui/material";
import { useMeetStatusLookup } from "../hooks/useFetchMeetStatuses";

type MeetStatusProps = {
  statusId?: number | null;
  fallbackLabel?: string;
};

export function MeetStatus({
  statusId,
  fallbackLabel = "Scheduled",
}: MeetStatusProps) {
  const { getName } = useMeetStatusLookup();
  const name = getName(statusId, fallbackLabel);

  // Prefer id-based mapping to avoid label mismatch
  let color: "default" | "primary" | "success" | "error" | "warning" =
    "primary";
  switch (statusId) {
    case 1: // Draft
      color = "default";
      break;
    case 2: // Published
      color = "success";
      break;
    case 3: // Open
      color = "primary";
      break;
    case 4: // Closed
      color = "primary";
      break;
    case 5: // Cancelled
      color = "error";
      break;
    case 6: // Postponed
      color = "warning";
      break;
    case 7: // Completed
      color = "success";
      break;
    default: {
      const normalized = name.toLowerCase();
      if (normalized === "draft") color = "default";
      if (normalized === "published") color = "success";
      if (normalized === "open") color = "primary";
      if (normalized === "completed") color = "success";
      if (normalized === "cancelled") color = "error";
      if (normalized === "postponed") color = "warning";
      break;
    }
  }

  return <Chip size="small" label={name} color={color} />;
}
