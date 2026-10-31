import { ReactNode } from "react";
import { Box, Card, CardActionArea, Typography } from "@mui/material";

type MeetShareOptionProps = {
  label: string;
  icon: ReactNode;
  onClick?: () => void;
  href?: string;
  target?: string;
  rel?: string;
  selected?: boolean;
};

export function MeetShareOption({
  label,
  icon,
  onClick,
  href,
  target,
  rel,
  selected,
}: MeetShareOptionProps) {
  return (
    <Card
      variant="outlined"
      sx={{ borderColor: selected ? "primary.main" : "divider" }}
    >
      <CardActionArea
        href={href}
        target={target}
        rel={rel}
        onClick={onClick}
        aria-pressed={selected}
        sx={{
          minHeight: 108,
          px: 1,
          py: 2,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 1,
        }}
      >
        <Box sx={{ color: "primary.main", display: "flex" }}>{icon}</Box>
        <Typography variant="body2" fontWeight={600} textAlign="center">
          {label}
        </Typography>
      </CardActionArea>
    </Card>
  );
}
