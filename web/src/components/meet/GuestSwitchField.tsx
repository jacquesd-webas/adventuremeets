import {
  Box,
  Button,
  FormControlLabel,
  FormHelperText,
  Stack,
  Switch,
  TextField,
} from "@mui/material";
import type { ReactNode } from "react";
import { GuestInput } from "../../types/GuestInput";
type LabeledFieldComponent = (props: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) => JSX.Element;

type GuestSwitchFieldProps = {
  allowGuests: boolean;
  namedGuests: boolean;
  disabled?: boolean;
  wantsGuests: boolean;
  guests: GuestInput[];
  guestErrors?: Record<string, string>;
  maxGuests: number;
  onToggle: (checked: boolean) => void;
  onGuestsChange: (guests: GuestInput[]) => void;
  LabeledFieldComponent: LabeledFieldComponent;
};

export function GuestSwitchField({
  allowGuests,
  namedGuests,
  disabled = false,
  wantsGuests,
  guests,
  guestErrors = {},
  maxGuests,
  onToggle,
  onGuestsChange,
  LabeledFieldComponent,
}: GuestSwitchFieldProps) {
  if (!allowGuests || disabled) return null;
  const canAddGuests = maxGuests <= 0 || guests.length < maxGuests;

  return (
    <Stack spacing={1}>
      <FormControlLabel
        control={
          <Switch
            checked={wantsGuests}
            onChange={(e) => onToggle(e.target.checked)}
          />
        }
        label="I would like to bring guests"
      />
      {wantsGuests && !disabled && (
        <Stack spacing={1}>
          {!namedGuests ? (
            <Box data-signup-error={guestErrors.guests ? "true" : undefined}>
              <LabeledFieldComponent label="Number of guests" required>
                <TextField
                  type="number"
                  value={guests.length || ""}
                  onChange={(event) => {
                    const count = Number(event.target.value);
                    if (!Number.isInteger(count) || count < 0 || count > 1000)
                      return;
                    onGuestsChange(
                      Array.from(
                        { length: count },
                        (_, index) =>
                          guests[index] ?? { name: "", isMinor: false },
                      ),
                    );
                  }}
                  inputProps={{ min: 1, max: maxGuests > 0 ? maxGuests : 1000 }}
                  error={Boolean(guestErrors.guests)}
                  helperText={guestErrors.guests}
                  fullWidth
                />
              </LabeledFieldComponent>
            </Box>
          ) : null}
          {namedGuests && (
            <>
              {guests.map((guest, index) => (
                <Box
                  key={index}
                  data-signup-error={
                    guestErrors[`guest:${index}`] ? "true" : undefined
                  }
                >
                  <LabeledFieldComponent
                    label={`Guest ${index + 1} name`}
                    required
                  >
                    <TextField
                      value={guest.name}
                      onChange={(e) => {
                        const next = [...guests];
                        next[index] = { ...next[index], name: e.target.value };
                        onGuestsChange(next);
                      }}
                      error={Boolean(guestErrors[`guest:${index}`])}
                      helperText={guestErrors[`guest:${index}`]}
                      fullWidth
                    />
                  </LabeledFieldComponent>
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ mt: 0.5 }}
                  >
                    <FormControlLabel
                      control={
                        <Switch
                          checked={guest.isMinor}
                          onChange={(e) => {
                            const next = [...guests];
                            next[index] = {
                              ...next[index],
                              isMinor: e.target.checked,
                            };
                            onGuestsChange(next);
                          }}
                        />
                      }
                      label="Guest is a minor"
                    />
                    <Button
                      size="small"
                      color="inherit"
                      onClick={() => {
                        const next = guests.filter((_, idx) => idx !== index);
                        onGuestsChange(next);
                      }}
                    >
                      Remove
                    </Button>
                  </Stack>
                </Box>
              ))}
              <Box data-signup-error={guestErrors.guests ? "true" : undefined}>
                <Button
                  size="small"
                  variant="outlined"
                  disabled={!canAddGuests}
                  onClick={() => {
                    if (!canAddGuests) return;
                    onGuestsChange([...guests, { name: "", isMinor: false }]);
                  }}
                >
                  {canAddGuests ? "+ Add guest" : "Guest limit reached"}
                </Button>
                {guestErrors.guests && (
                  <FormHelperText error>{guestErrors.guests}</FormHelperText>
                )}
              </Box>
            </>
          )}
        </Stack>
      )}
    </Stack>
  );
}
