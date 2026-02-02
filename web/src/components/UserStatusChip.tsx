import { Chip } from "@mui/material";
import { User } from "../types/UserModel";

type UserStatusChipProps = {
  user?: User;
};

const roleColors: Record<string, string> = {
  verified: "#2e7d32",
  pending: "#1e88e5",
  disabled: "#757575",
};

export function UserStatusChip({ user }: UserStatusChipProps) {
  const status = user?.isDisabled
    ? "Disabled"
    : user?.emailVerified
    ? "Verified"
    : "Pending";

  const color = roleColors[status.toLowerCase()] || roleColors.disabled;

  return (
    <Chip
      label={status}
      size="small"
      sx={{
        bgcolor: color,
        color: "#fff",
        borderRadius: 1,
        height: 20,
        fontSize: "0.7rem",
        textTransform: "uppercase",
        "& .MuiChip-label": {
          px: 0.6,
        },
      }}
    />
  );
}
