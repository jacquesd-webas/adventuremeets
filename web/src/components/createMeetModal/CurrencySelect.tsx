import { useEffect } from "react";
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

const handleSetDefaultCurrency = () => {
  // Placeholder for setting default currency logic, e.g., from user settings or locale
  return "ZAR";
}

export const getCurrencySymbol = (code: string) =>
  currencyOptions.find((option) => option.code === code)?.symbol || code;

export const CurrencySelect = ({ value, onChange }: CurrencySelectProps) => {
  useEffect(() => {
    if (!value) {
      handleSetDefaultCurrency();
    }
  }, [value]);

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