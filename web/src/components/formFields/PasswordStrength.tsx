import { Box, Typography } from "@mui/material";

type PasswordStrengthProps = {
  label: string;
  percent: number;
  score: number;
};

export function PasswordStrength({
  label,
  percent,
  score,
}: PasswordStrengthProps) {
  return (
    <Box
      sx={{
        mt: -1.5,
        mb: 2,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 0.5,
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Password strength
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
      </Box>
      <Box
        sx={{
          height: 6,
          borderRadius: 999,
          backgroundColor: "action.hover",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            height: "100%",
            width: `${percent}%`,
            transition: "width 200ms ease",
            backgroundColor:
              score <= 1 ? "error.main" : score <= 3 ? "warning.main" : "success.main",
          }}
        />
      </Box>
    </Box>
  );
}
