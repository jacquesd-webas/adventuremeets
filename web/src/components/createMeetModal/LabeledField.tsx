import { Box, Typography } from "@mui/material";

type LabeledFieldProps = {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  labelAction?: React.ReactNode;
  sx?: React.CSSProperties;
};

export function LabeledField({
  label,
  required,
  children,
  labelAction,
  sx,
}: LabeledFieldProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        ...(sx || {})
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          mb: 0.5,
        }}
      >
        <Typography variant="h6" fontWeight={700}>
          {label}{" "}
          {required && (
            <span style={{ color: "#ef4444", fontSize: "1.2em" }}>*</span>
          )}
        </Typography>
        {labelAction}
      </Box>
      {children}
    </Box>
  );
}
