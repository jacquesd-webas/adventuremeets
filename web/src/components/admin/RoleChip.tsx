import { Chip, useTheme } from "@mui/material";
import { useFetchRoles } from "../../hooks/useFetchRoles";

type RoleChipProps = {
  role?: string;
  roleId?: number;
};

const roleColors: Record<string, string> = {
  admin: "#2e7d32",
  organizer: "#ef6c00",
  member: "#1e88e5",
};

export function RoleChip({ role, roleId }: RoleChipProps) {
  const theme = useTheme();
  const { data: roles } = useFetchRoles();

  if (!role && roleId && roles) {
    const matchedRole = roles.find((r) => r.id === roleId);
    role = matchedRole ? matchedRole.name : "member";
  }

  const normalizedRole = role?.toLowerCase() || "member";
  const color = roleColors[normalizedRole] || roleColors.member;
  const isDark = theme.palette.mode === "dark";

  return (
    <Chip
      label={normalizedRole}
      size="small"
      variant={isDark ? "outlined" : "filled"}
      sx={{
        bgcolor: isDark ? "transparent" : color,
        color: isDark ? color : "#fff",
        borderColor: isDark ? color : undefined,
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
