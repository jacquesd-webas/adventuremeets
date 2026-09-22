import { Box, Stack, Switch, TextField, Typography } from "@mui/material";
import { useEffect, useRef } from "react";
import { LabeledField } from "./LabeledField";
import { StepProps, getFieldError } from "./CreateMeetState";
import { HelpBanner } from "./HelpBanner";

export const TimeAndLocationStep = ({
  state,
  setState,
  errors = [],
  disabled = false,
  isHelpEnabled = false,
  isHelpBannerDismissed = false,
  onDismissHelpBanner,
}: StepProps) => {
  const lastGeocoded = useRef("");
  const locationError = getFieldError(errors, "location");
  const startTimeError = getFieldError(errors, "startTime");
  const endTimeError = getFieldError(errors, "endTime");
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
    <Box sx={{ position: "relative" }}>
      <Stack spacing={2}>
        <LabeledField
          label="Location / Meeting point"
          labelAction={
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="caption" color="text.secondary">
                Show map
              </Typography>
              <Switch
                size="small"
                checked={state.useMap}
                disabled={disabled}
                onChange={(event) =>
                  setState((prev) => ({
                    ...prev,
                    useMap: event.target.checked,
                  }))
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
            error={Boolean(locationError)}
            helperText={
              locationError ||
              (isHelpEnabled
                ? "You can either use a specific address or general area. You may also hide the map if you like."
                : undefined)
            }
            disabled={disabled}
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
                  Show time
                </Typography>
                <Switch
                  size="small"
                  checked={!state.startTimeTbc}
                  disabled={disabled}
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
              inputProps={{ "data-testid": "start-time-input" }}
              InputLabelProps={{ shrink: true }}
              error={Boolean(startTimeError)}
              helperText={
                startTimeError ||
                (isHelpEnabled
                  ? "Type the date or use the calender/time picker. If you don't know the exact time you are meeting yet, you can toggle off the time to just show the date."
                  : undefined)
              }
              disabled={disabled}
            />
          </LabeledField>
          <LabeledField
            label="End time"
            required
            sx={{ flex: 1 }}
            labelAction={
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="caption" color="text.secondary">
                  Show time
                </Typography>
                <Switch
                  size="small"
                  checked={!state.endTimeTbc}
                  disabled={disabled || state.startTimeTbc}
                  onChange={(event) => {
                    const showTime = event.target.checked;
                    setState((prev) => {
                      if (showTime) {
                        return { ...prev, endTimeTbc: false };
                      }
                      const date = prev.endTime
                        ? prev.endTime.slice(0, 10)
                        : "";
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
              inputProps={{ "data-testid": "end-time-input" }}
              error={Boolean(endTimeError)}
              helperText={
                endTimeError ||
                (isHelpEnabled
                  ? "Set a realistic end time to set expecations for attendees. If you don't know or it doesn't matter you can toggle off the time to just show the date."
                  : undefined)
              }
              disabled={disabled}
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
      {isHelpEnabled && !isHelpBannerDismissed ? (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            p: 1,
            bgcolor: "rgba(255,255,255,0.72)",
            backdropFilter: "blur(1px)",
          }}
        >
          <Box sx={{ width: "100%", maxWidth: 760 }}>
            <HelpBanner
              message={
                <>
                  You will need to set a date your meet and optionally a time
                  and location.
                  <br />
                  <br />
                  Your location will be shown on the meet so you can either be
                  specific or give a general area if you don't want randoms who
                  were not approved appearing. In this case you will need to
                  communicate the actual meeting point and time to the approved
                  applicants.
                  <br />
                  <br /> Similary, the time can be specific or just the date if
                  you have not decided exactly when to start.
                </>
              }
              onDismiss={onDismissHelpBanner || (() => undefined)}
            />
          </Box>
        </Box>
      ) : null}
    </Box>
  );
};
