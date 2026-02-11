import { Box, Typography } from "@mui/material";

export function PreviewBanner() {
  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 2,
        bgcolor: "warning.light",
        px: 2,
        py: 1.5,
        boxShadow: 1,
      }}
    >
      <Typography
        variant="body2"
        align="center"
        color="text.primary"
        fontWeight={600}
      >
        PREVIEW ONLY - No changes will be saved on this form
      </Typography>
    </Box>
  );
}
