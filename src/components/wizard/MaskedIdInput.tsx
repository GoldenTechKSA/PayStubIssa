import React, { useState, useEffect } from "react";
import { TextField } from "@mui/material";

type Mode = "ein" | "ssn";

interface MaskedIdInputProps {
  value: string; // raw digits (up to 9)
  onChange: (rawDigits: string) => void;
  mode: Mode;
  label: string;
  required?: boolean;
  helperText?: string;
}

const maskedFull = (mode: Mode) => (mode === "ein" ? "XX-XXXXXXX" : "XXX-XX-XXXX");

const formatDigits = (raw: string, mode: Mode): string => {
  const d = raw.replace(/\D/g, "").substring(0, 9);
  if (mode === "ein") {
    return d.length <= 2 ? d : `${d.slice(0, 2)}-${d.slice(2)}`;
  }
  // ssn
  if (d.length <= 3) return d;
  if (d.length <= 5) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`;
};

/**
 * Masked EIN/SSN field (MUI). Stores raw digits in Redux; shows formatted digits
 * while typing and a fully-masked value (XX-XXXXXXX / XXX-XX-XXXX) once 9 digits
 * are entered and the field loses focus. Replaces the old Bootstrap EIN/SSN inputs.
 */
export const MaskedIdInput: React.FC<MaskedIdInputProps> = ({ value, onChange, mode, label, required, helperText }) => {
  const [display, setDisplay] = useState("");
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    const digits = value.replace(/\D/g, "");
    if (digits.length === 9) {
      setComplete(true);
      setDisplay(maskedFull(mode));
    } else {
      setComplete(false);
      setDisplay(formatDigits(value, mode));
    }
  }, [value, mode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (complete) setComplete(false);
    const digits = e.target.value.replace(/\D/g, "").substring(0, 9);
    onChange(digits);
    setDisplay(digits.length === 9 ? maskedFull(mode) : formatDigits(digits, mode));
  };

  const handleFocus = () => {
    if (complete && value.replace(/\D/g, "").length === 9) {
      setDisplay(formatDigits(value, mode));
    }
  };

  const handleBlur = () => {
    if (value.replace(/\D/g, "").length === 9) {
      setDisplay(maskedFull(mode));
      setComplete(true);
    }
  };

  return (
    <TextField
      fullWidth
      label={label}
      required={required}
      value={display}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      helperText={helperText ?? " "}
      inputProps={{ maxLength: 11, inputMode: "numeric" }}
    />
  );
};

export default MaskedIdInput;
