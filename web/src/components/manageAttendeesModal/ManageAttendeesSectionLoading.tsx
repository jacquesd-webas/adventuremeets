import { CircularProgress, Stack, Typography } from "@mui/material";

type ManageAttendeesSectionLoadingProps = {
  label: string;
  minHeight?: number | string;
};

export function ManageAttendeesSectionLoading({
  label,
  minHeight = 96,
}: ManageAttendeesSectionLoadingProps) {
  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      spacing={1}
      sx={{ minHeight }}
    >
      <CircularProgress size={24} />
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Stack>
  );
}

export default ManageAttendeesSectionLoading;
