import { Box, Typography } from "@mui/material";

type LabeledFieldProps = {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  sx?: React.CSSProperties;
};

export function LabeledField({ label, required, children, sx }: LabeledFieldProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        ...(sx || {})
      }}
    >
      <Typography variant="h6" fontWeight={700} mb={0.5}>
        {label} {required && <span style={{ color: "#ef4444", fontSize: "1.2em" }}>*</span>}
      </Typography>
      {children}
    </Box>
  );
}
