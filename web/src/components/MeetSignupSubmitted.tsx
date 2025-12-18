import { Box, Button, Container, Paper, Stack, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

export function MeetSignupSubmitted() {
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack spacing={2} alignItems="center" textAlign="center">
          <Box
            sx={{
              width: 96,
              height: 96,
              borderRadius: "50%",
              bgcolor: "#16a34a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <CheckCircleIcon sx={{ color: "#ffffff", fontSize: 64 }} />
          </Box>
          <Typography variant="h5" fontWeight={700}>
            Application submitted
          </Typography>
          <Typography color="text.secondary">
            Your application has been submitted. You will be notified by the
            organizer when meet attendance has been finalized.
          </Typography>
          <Typography color="text.secondary">
            Should you wish to make changes or withdraw your application, please
            use the link e-mailed to you, or create a profile to manage your
            meets.
          </Typography>
          <Button variant="contained" href="/profile/create">
            Create Profile
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}
