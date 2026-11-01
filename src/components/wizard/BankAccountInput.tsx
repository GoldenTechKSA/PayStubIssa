import React, { useState } from "react";
import { TextField } from "@mui/material";

interface BankAccountInputProps {
  value: string; // raw digits (4–17)
  onChange: (rawDigits: string) => void;
  label: string;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  onBlur?: () => void;
}

const MAX_DIGITS = 17;

// "********6789": every digit but the last four hidden.
const maskDigits = (digits: string): string =>
  digits.length < 4 ? digits : "*".repeat(digits.length - 4) + digits.slice(-4);

/**
 * Bank account number field (MUI). Stores raw digits in Redux; shows the digits while the field
 * has focus and a masked value (********6789) once it loses focus, so a number is never left on
 * screen in full. Same idea as MaskedIdInput, but account numbers have no fixed length or grouping.
 */
export const BankAccountInput: React.FC<BankAccountInputProps> = ({
  value, onChange, label, required, error, helperText, onBlur,
}) => {
  const [focused, setFocused] = useState(false);
  const digits = value.replace(/\D/g, "");

  return (
    <TextField
      fullWidth
      label={label}
      required={required}
      error={error}
      value={focused ? digits : maskDigits(digits)}
      onChange={e => onChange(e.target.value.replace(/\D/g, "").substring(0, MAX_DIGITS))}
      onFocus={() => setFocused(true)}
      onBlur={() => { setFocused(false); onBlur?.(); }}
      helperText={helperText ?? " "}
      inputProps={{ maxLength: MAX_DIGITS, inputMode: "numeric" }}
    />
  );
};

export default BankAccountInput;
