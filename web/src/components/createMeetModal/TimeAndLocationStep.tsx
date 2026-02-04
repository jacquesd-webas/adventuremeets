import { Box, Stack, Switch, TextField, Typography } from "@mui/material";
import { useEffect, useRef } from "react";
import { LabeledField } from "./LabeledField";
import { StepProps, getFieldError } from "./CreateMeetState";

export const TimeAndLocationStep = ({ state, setState, errors }: StepProps) => {
  const lastGeocoded = useRef("");
  const startDateValue = state.startTime ? state.startTime.slice(0, 10) : "";
  const startInputValue = state.startTimeTbc ? startDateValue : state.startTime;
  const endDateValue = state.endTime ? state.endTime.slice(0, 10) : "";
  const endInputValue = state.endTimeTbc ? endDateValue : state.endTime;

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as
      | string
      | undefined;
    if (!state.useMap || !state.location || !apiKey) {
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
          { signal: controller.signal },
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
  }, [state.location, setState, state.useMap]);

  return (
    <Stack spacing={2}>
      <LabeledField
        label="Location / Meeting point"
        labelAction={
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="caption" color="text.secondary">
              Use map
            </Typography>
            <Switch
              size="small"
              checked={state.useMap}
              onChange={(event) =>
                setState((prev) => ({ ...prev, useMap: event.target.checked }))
              }
            />
          </Stack>
        }
      >
        <TextField
          placeholder={`Where is the meeting place?${state.useMap ? " (search updates the map below)" : ""}`}
          value={state.location}
          onChange={(e) =>
            setState((prev) => {
              const location = e.target.value;
              if (!location.trim()) {
                return {
                  ...prev,
                  location,
                  locationLat: "",
                  locationLong: "",
                };
              }
              return { ...prev, location };
            })
          }
          fullWidth
          error={Boolean(getFieldError(errors, "location"))}
          helperText={getFieldError(errors, "location")}
        />
      </LabeledField>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ width: "100%" }}
      >
        <LabeledField
          label="Start time"
          required
          sx={{ flex: 1 }}
          labelAction={
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="caption" color="text.secondary">
                Use time
              </Typography>
              <Switch
                size="small"
                checked={!state.startTimeTbc}
                onChange={(event) => {
                  const showTime = event.target.checked;
                  setState((prev) => {
                    if (showTime) {
                      return { ...prev, startTimeTbc: false };
                    }
                    const date = prev.startTime
                      ? prev.startTime.slice(0, 10)
                      : "";
                    return {
                      ...prev,
                      startTimeTbc: true,
                      endTimeTbc: true,
                      startTime: date ? `${date}T00:00` : "",
                    };
                  });
                }}
              />
            </Stack>
          }
        >
          <TextField
            type={state.startTimeTbc ? "date" : "datetime-local"}
            placeholder={
              state.startTimeTbc
                ? "Select the meet date"
                : "Select when the meet starts"
            }
            value={startInputValue}
            onChange={(e) =>
              setState((prev) => {
                const nextStart = prev.startTimeTbc
                  ? e.target.value
                    ? `${e.target.value}T00:00`
                    : ""
                  : e.target.value;
                const shouldSyncEnd = !prev.endTime;
                return {
                  ...prev,
                  startTime: nextStart,
                  endTime: shouldSyncEnd ? nextStart : prev.endTime,
                };
              })
            }
            fullWidth
            InputLabelProps={{ shrink: true }}
            error={Boolean(getFieldError(errors, "startTime"))}
            helperText={getFieldError(errors, "startTime")}
          />
        </LabeledField>
        <LabeledField
          label="End time"
          required
          sx={{ flex: 1 }}
          labelAction={
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="caption" color="text.secondary">
                Use time
              </Typography>
              <Switch
                size="small"
                checked={!state.endTimeTbc}
                disabled={state.startTimeTbc}
                onChange={(event) => {
                  const showTime = event.target.checked;
                  setState((prev) => {
                    if (showTime) {
                      return { ...prev, endTimeTbc: false };
                    }
                    const date = prev.endTime ? prev.endTime.slice(0, 10) : "";
                    return {
                      ...prev,
                      endTimeTbc: true,
                      endTime: date ? `${date}T00:00` : "",
                    };
                  });
                }}
              />
            </Stack>
          }
        >
          <TextField
            type={state.endTimeTbc ? "date" : "datetime-local"}
            placeholder={
              state.endTimeTbc
                ? "Select the meet end date"
                : "Select when the meet ends"
            }
            value={endInputValue}
            onChange={(e) =>
              setState((prev) => ({
                ...prev,
                endTime: prev.endTimeTbc
                  ? e.target.value
                    ? `${e.target.value}T00:00`
                    : ""
                  : e.target.value,
              }))
            }
            fullWidth
            InputLabelProps={{ shrink: true }}
            error={Boolean(getFieldError(errors, "endTime"))}
            helperText={getFieldError(errors, "endTime")}
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
          bgcolor: "background.paper",
        }}
      >
        {state.useMap ? (
          state.location ? (
            <iframe
              title="Location map"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              src={`https://www.google.com/maps?q=${encodeURIComponent(state.location)}&output=embed`}
            />
          ) : (
            <Stack
              alignItems="center"
              justifyContent="center"
              sx={{ height: "100%" }}
            >
              <Typography color="text.secondary">
                Start typing a location to preview it on the map.
              </Typography>
            </Stack>
          )
        ) : (
          <Stack
            alignItems="center"
            justifyContent="center"
            sx={{
              height: "100%",
              bgcolor: "action.disabledBackground",
            }}
          >
            <Typography color="text.secondary">Map disabled</Typography>
          </Stack>
        )}
      </Box>
    </Stack>
  );
};
