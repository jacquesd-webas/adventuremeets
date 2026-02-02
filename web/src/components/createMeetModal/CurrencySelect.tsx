import { MenuItem, TextField } from "@mui/material";

const currencyOptions = [
  { code: "ZAR", symbol: "R" },
  { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "€" },
  { code: "GBP", symbol: "£" }
];

export type CurrencySelectProps = {
  value: string;
  onChange?: (value: string) => void;
};

// eslint-disable-next-line react-refresh/only-export-components
export const getCurrencySymbol = (code: string) =>
  currencyOptions.find((option) => option.code === code)?.symbol || code;

export const CurrencySelect = ({ value, onChange }: CurrencySelectProps) => {
  return (
  <TextField
    select
    value={value}
    onChange={(e) => onChange?.(e.target.value)}
    SelectProps={{ MenuProps: { sx: { zIndex: 1501 } } }}
    fullWidth
  >
    {currencyOptions.map((option) => (
      <MenuItem key={option.code} value={option.code}>
        {option.code} ({option.symbol})
      </MenuItem>
    ))}
  </TextField>
);
}
