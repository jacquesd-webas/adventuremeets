import { Chip } from "@mui/material";
import { useMeetStatusLookup } from "../hooks/useFetchMeetStatuses";

type MeetStatusProps = {
  statusId?: number | null;
  fallbackLabel?: string;
};

export function MeetStatus({ statusId, fallbackLabel = "Scheduled" }: MeetStatusProps) {
  const { getName } = useMeetStatusLookup();
  const name = getName(statusId, fallbackLabel);

  const normalized = name.toLowerCase();
  let color: "default" | "primary" | "success" | "error" | "warning" = "primary";
  if (normalized === "draft") color = "default";
  if (normalized === "published") color = "success";
  if (normalized === "cancelled") color = "error";
  if (normalized === "postponed") color = "warning";

  return <Chip size="small" label={name} color={color} />;
}
