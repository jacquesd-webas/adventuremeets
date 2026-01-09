import { Box, Button, Stack } from "@mui/material";

type MobileDashboardTitleProps = {
  onNewMeet: () => void;
};

export function MobileDashboardTitle({ onNewMeet }: MobileDashboardTitleProps) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2, px: 1 }}>
      <Box component="img" src="/static/adventuremeets-logo.svg" alt="AdventureMeets logo" sx={{ height: 28 }} />
      <Button variant="contained" size="small" onClick={onNewMeet}>
        New Meet
      </Button>
    </Stack>
  );
}
