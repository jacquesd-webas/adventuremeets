import { Box, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useRef } from "react";
import { LabeledField } from "./LabeledField";
import { StepProps } from "./CreateMeetState";

export const TimeAndLocationStep = ({ state, setState }: StepProps) => {
  const lastGeocoded = useRef("");

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
    if (!state.location || !apiKey) {
      return;
    }
    if (state.location === lastGeocoded.current) {
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(state.location)}&key=${apiKey}`,
          { signal: controller.signal }
        );
        if (!res.ok) return;
        const data = await res.json();
        const result = data.results?.[0];
        if (!result?.geometry?.location) return;
        const { lat, lng } = result.geometry.location;
        lastGeocoded.current = state.location;
        setState((prev) => ({ ...prev, locationLat: lat, locationLong: lng }));
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
      }
    }, 500);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [state.location, setState]);

  return (
    <Stack spacing={2}>
    <LabeledField label="Location" required>
      <TextField
        placeholder="Where is the meeting place? (search updates the map below)"
        value={state.location}
        onChange={(e) => setState((prev) => ({ ...prev, location: e.target.value }))}
        fullWidth
      />
    </LabeledField>
    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ width: "100%" }}>
      <LabeledField label="Start time" required sx={{ flex: 1 }}>
        <TextField
          type="datetime-local"
          placeholder="Select when the meet starts"
          value={state.startTime}
          onChange={(e) => setState((prev) => ({ ...prev, startTime: e.target.value }))}
          fullWidth
          InputLabelProps={{ shrink: true }}
        />
      </LabeledField>
      <LabeledField label="Duration (hh:mm)" sx={{ flex: 1 }}>
        <TextField
          type="time"
          inputProps={{ step: 60 }}
          placeholder="Duration (hh:mm)"
          value={state.duration || ""}
          onChange={(e) => setState((prev) => ({ ...prev, duration: e.target.value }))}
          fullWidth
          InputLabelProps={{ shrink: true }}
        />
      </LabeledField>
      <LabeledField label="End time" required sx={{ flex: 1 }}>
        <TextField
          type="datetime-local"
          placeholder="Select when the meet ends"
          value={state.endTime}
          onChange={(e) => setState((prev) => ({ ...prev, endTime: e.target.value }))}
          fullWidth
          InputLabelProps={{ shrink: true }}
        />
      </LabeledField>
    </Stack>
    <Box
      sx={{
        mt: 1,
        width: "100%",
        height: 260,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        overflow: "hidden",
        bgcolor: "background.paper"
      }}
    >
      {state.location ? (
        <iframe
          title="Location map"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          src={`https://www.google.com/maps?q=${encodeURIComponent(state.location)}&output=embed`}
        />
      ) : (
        <Stack alignItems="center" justifyContent="center" sx={{ height: "100%" }}>
          <Typography color="text.secondary">Start typing a location to preview it on the map.</Typography>
        </Stack>
      )}
    </Box>
  </Stack>
  );
};
