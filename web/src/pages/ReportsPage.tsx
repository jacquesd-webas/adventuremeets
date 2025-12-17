import { Typography, Paper, Stack } from "@mui/material";

function ReportsPage() {
  return (
    <Stack spacing={2}>
      <Typography variant="h4" fontWeight={700}>
        Reports
      </Typography>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography color="text.secondary">Reports will appear here.</Typography>
      </Paper>
    </Stack>
  );
}

export default ReportsPage;
