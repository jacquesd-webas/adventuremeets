import { Box, Paper, Stack, Typography } from "@mui/material";

export function MeetNotFound() {
  return (
    <Paper
      variant="outlined"
      sx={{
        width: "min(720px, 92vw)",
        minHeight: "80vh",
        mt: 8,
        mx: "auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: { xs: 3, sm: 4 },
        borderRadius: 3,
        textAlign: "center",
        background: "linear-gradient(145deg, rgba(255,236,210,0.6), rgba(252,182,159,0.45))"
      }}
    >
      <Stack spacing={2} alignItems="center">
        <Box sx={{ width: 220, height: 220 }}>
          <svg viewBox="0 0 240 240" width="100%" height="100%" aria-hidden="true">
            <defs>
              <linearGradient id="lost-sky" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fde68a" />
                <stop offset="100%" stopColor="#fdba74" />
              </linearGradient>
            </defs>
            <rect x="20" y="20" width="200" height="200" rx="28" fill="url(#lost-sky)" opacity="0.35" />
            <path d="M40 170l40-50 28 30 26-34 46 54H40z" fill="#fdba74" opacity="0.6" />
            <path d="M55 170l26-34 24 26 22-30 36 38H55z" fill="#fb923c" opacity="0.85" />
            <circle cx="150" cy="88" r="18" fill="#fbbf24" />
            <circle cx="150" cy="88" r="10" fill="#fff7ed" />
            <circle cx="150" cy="88" r="3" fill="#f97316" />
            <path d="M106 120l-10 22 16 6 8-16 14 8 6-10-20-10z" fill="#7c2d12" />
            <circle cx="110" cy="112" r="10" fill="#fdba74" />
            <path d="M102 112c6-8 16-8 22 0" stroke="#7c2d12" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M114 122v28" stroke="#7c2d12" strokeWidth="5" strokeLinecap="round" />
            <path d="M114 138l-18 18" stroke="#7c2d12" strokeWidth="4" strokeLinecap="round" />
            <path d="M114 138l18 14" stroke="#7c2d12" strokeWidth="4" strokeLinecap="round" />
            <path d="M114 150l-10 22" stroke="#7c2d12" strokeWidth="4" strokeLinecap="round" />
            <path d="M114 150l12 20" stroke="#7c2d12" strokeWidth="4" strokeLinecap="round" />
            <path d="M140 118c8-2 16 6 10 14" stroke="#7c2d12" strokeWidth="3" strokeLinecap="round" fill="none" />
            <circle cx="150" cy="124" r="5" fill="#7c2d12" />
            <path d="M80 96l10-12" stroke="#fb7185" strokeWidth="4" strokeLinecap="round" />
            <path d="M74 94l14-6" stroke="#fb7185" strokeWidth="4" strokeLinecap="round" />
            <path d="M150 168c10 8 26 8 36 0" stroke="#fb923c" strokeWidth="4" strokeLinecap="round" fill="none" />
          </svg>
        </Box>
        <Typography variant="h4" fontWeight={700}>
          Meet not found
        </Typography>
        <Typography color="text.secondary">
          This trail went nowhere. Double-check the link or ask the organizer to resend it.
        </Typography>
      </Stack>
    </Paper>
  );
}
