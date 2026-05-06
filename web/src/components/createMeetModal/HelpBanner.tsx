import { Alert, Button, Stack } from "@mui/material";

type HelpBannerProps = {
  message: string;
  onDismiss: () => void;
};

export function HelpBanner({ message, onDismiss }: HelpBannerProps) {
  return (
    <Alert severity="info">
      <Stack spacing={2}>
        <span>{message}</span>
        <Stack direction="row" justifyContent="center">
          <Button variant="outlined" size="small" onClick={onDismiss}>
            Got it
          </Button>
        </Stack>
      </Stack>
    </Alert>
  );
}
