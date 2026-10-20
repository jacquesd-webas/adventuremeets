import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { GuestSwitchField } from "../GuestSwitchField";

const LabeledField = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => (
  <Stack>
    <Typography>{label}</Typography>
    {children}
  </Stack>
);

it("uses a count field when guest names are optional", async () => {
  const onGuestsChange = vi.fn();
  render(
    <GuestSwitchField
      allowGuests
      namedGuests={false}
      wantsGuests
      guests={[]}
      maxGuests={3}
      onToggle={vi.fn()}
      onGuestsChange={onGuestsChange}
      LabeledFieldComponent={LabeledField}
    />,
  );

  expect(screen.queryByText("Guest 1 name")).not.toBeInTheDocument();
  await userEvent.type(screen.getByRole("spinbutton"), "2");
  expect(onGuestsChange).toHaveBeenCalledWith([
    { name: "", isMinor: false },
    { name: "", isMinor: false },
  ]);
});

it("shows an individual name field when named guests are required", () => {
  render(
    <GuestSwitchField
      allowGuests
      namedGuests
      wantsGuests
      guests={[{ name: "", isMinor: false }]}
      maxGuests={3}
      onToggle={vi.fn()}
      onGuestsChange={vi.fn()}
      LabeledFieldComponent={LabeledField}
    />,
  );

  expect(screen.getByText("Guest 1 name")).toBeInTheDocument();
  expect(screen.queryByText("Number of guests")).not.toBeInTheDocument();
});
