import { Chip } from "@mui/material";

type RoleChipProps = {
  role?: string;
};

const roleColors: Record<string, string> = {
  admin: "#2e7d32",
  organizer: "#ef6c00",
  member: "#1e88e5",
};

export function RoleChip({ role }: RoleChipProps) {
  const normalizedRole = role?.toLowerCase() || "member";
  const color = roleColors[normalizedRole] || roleColors.member;

  return (
    <Chip
      label={normalizedRole}
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
