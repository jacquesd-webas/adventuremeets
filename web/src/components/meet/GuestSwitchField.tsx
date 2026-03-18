import {
  Box,
  Button,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
} from "@mui/material"
import type { ReactNode } from "react"
import { GuestInput } from "../../types/GuestInput"
type LabeledFieldComponent = (props: {
  label: string
  required?: boolean
  children: ReactNode
}) => JSX.Element

type GuestSwitchFieldProps = {
  allowGuests: boolean
  disabled?: boolean
  wantsGuests: boolean
  guests: GuestInput[]
  maxGuests: number
  onToggle: (checked: boolean) => void
  onGuestsChange: (guests: GuestInput[]) => void
  LabeledFieldComponent: LabeledFieldComponent
}

export function GuestSwitchField({
  allowGuests,
  disabled = false,
  wantsGuests,
  guests,
  maxGuests,
  onToggle,
  onGuestsChange,
  LabeledFieldComponent,
}: GuestSwitchFieldProps) {
  if (!allowGuests || disabled) return null

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
          {guests.map((guest, index) => (
            <Box key={index}>
              <LabeledFieldComponent
                label={`Guest ${index + 1} name`}
                required
              >
                <TextField
                  value={guest.name}
                  onChange={(e) => {
                    const next = [...guests]
                    next[index] = { ...next[index], name: e.target.value }
                    onGuestsChange(next)
                  }}
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
                        const next = [...guests]
                        next[index] = {
                          ...next[index],
                          isMinor: e.target.checked,
                        }
                        onGuestsChange(next)
                      }}
                    />
                  }
                  label="Guest is a minor"
                />
                <Button
                  size="small"
                  color="inherit"
                  onClick={() => {
                    const next = guests.filter((_, idx) => idx !== index)
                    onGuestsChange(next)
                  }}
                >
                  Remove
                </Button>
              </Stack>
            </Box>
          ))}
          <Box>
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                onGuestsChange([...guests, { name: "", isMinor: false }])
              }}
            >
              + Add guest
            </Button>
          </Box>
        </Stack>
      )}
    </Stack>
  )
}
