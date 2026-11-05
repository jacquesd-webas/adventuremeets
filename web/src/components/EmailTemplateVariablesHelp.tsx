import { useState } from "react";
import { Box, Link, Popover, Stack, Typography } from "@mui/material";

const variables = [
  ["{{name}}", "Attendee name"],
  ["{{meet}}", "Meet name"],
  ["{{organiser}}", "Meet organiser name"],
  ["{{start_date}}", "Meet start date"],
  ["{{end_date}}", "Meet end date"],
  ["{{start_time}}", "Meet start time"],
  ["{{end_time}}", "Meet end time"],
  ["{{location}}", "Meet location"],
] as const;

export function EmailTemplateVariablesHelp() {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  return (
    <>
      <Typography variant="caption" color="text.secondary">
        You may use variables in your response. To see list{" "}
        <Link
          component="button"
          type="button"
          variant="caption"
          onClick={(event) => setAnchorEl(event.currentTarget)}
          sx={{ verticalAlign: "baseline" }}
        >
          click here
        </Link>
        .
      </Typography>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        sx={{ zIndex: 1401 }}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        PaperProps={{ sx: { p: 2, maxWidth: 320 } }}
      >
        <Stack spacing={1}>
          {variables.map(([variable, description]) => (
            <Typography key={variable} variant="body2">
              <Box component="code" sx={{ mr: 1 }}>
                {variable}
              </Box>
              {description}
            </Typography>
          ))}
        </Stack>
      </Popover>
    </>
  );
}
