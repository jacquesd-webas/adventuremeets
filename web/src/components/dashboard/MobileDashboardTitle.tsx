import { Box, Button, Stack } from "@mui/material";
import { getLogoSrc } from "../../helpers/logo";

type MobileDashboardTitleProps = {
  onNewMeet: () => void;
};

export function MobileDashboardTitle({ onNewMeet }: MobileDashboardTitleProps) {
  const logoSrc = getLogoSrc();
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2, px: 1 }}>
      <Box component="img" src={logoSrc} alt="AdventureMeets logo" sx={{ height: 28 }} />
      <Button variant="contained" size="small" onClick={onNewMeet}>
        New Meet
      </Button>
    </Stack>
  );
}
