import React, { useState, useEffect, useRef } from 'react';
import { Form, Col } from 'react-bootstrap';

interface EINInputProps {
  value: string; // Stores the actual digits
  onChange: (value: string) => void;
}

export const EINInput: React.FC<EINInputProps> = ({ value, onChange }) => {
  const [displayValue, setDisplayValue] = useState<string>('');
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Format raw EIN value to display format (XX-XXXXXXX) with actual digits
  const formatEINWithDigits = (rawValue: string): string => {
    const digitsOnly = rawValue.replace(/\D/g, '').substring(0, 9);
    if (digitsOnly.length <= 2) {
      return digitsOnly;
    } else {
      return `${digitsOnly.substring(0, 2)}-${digitsOnly.substring(2)}`;
    }
  };

  // Create masked display (XX-XXXXXXX with X's)
  const createMaskedDisplay = (digitCount: number): string => {
    if (digitCount === 0) return '';
    if (digitCount <= 2) {
      return 'X'.repeat(digitCount);
    } else {
      const secondPartLength = Math.min(digitCount - 2, 7);
      return `XX-${'X'.repeat(secondPartLength)}`;
    }
  };

  // Update display based on current state
  useEffect(() => {
    const cleanValue = value.replace(/\D/g, '');
    const digitCount = cleanValue.length;
    
    if (digitCount === 9) {
      // Complete - show masked version
      setIsComplete(true);
      setDisplayValue('XX-XXXXXXX');
    } else {
      // Incomplete - show actual digits with formatting
      setIsComplete(false);
      setDisplayValue(formatEINWithDigits(value));
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value;
    
    // If we're in masked state and user starts typing again, unmask
    if (isComplete) {
      setIsComplete(false);
    }
    
    // Extract only digits from the input
    const digitsOnly = inputValue.replace(/\D/g, '');
    const limitedDigits = digitsOnly.substring(0, 9);
    
    // Update parent with raw digits
    onChange(limitedDigits);
    
    // Update local display for immediate feedback (before useEffect runs)
    if (limitedDigits.length === 9) {
      setDisplayValue('XX-XXXXXXX');
    } else {
      setDisplayValue(formatEINWithDigits(limitedDigits));
    }
  };

  const handleInputFocus = () => {
    // If input is complete and user focuses, show actual digits temporarily
    if (isComplete && value.length === 9) {
      setDisplayValue(formatEINWithDigits(value));
    }
  };

  const handleInputBlur = () => {
    // When user leaves the field and it's complete, mask it again
    if (value.length === 9) {
      setDisplayValue('XX-XXXXXXX');
      setIsComplete(true);
    }
  };

  return (
    <Form.Group as={Col} controlId="companyEinId">
      <Form.Label className="label_fontsize">Enter company EIN - XX-XXXXXXX 9 digits (optional)</Form.Label>
      <Form.Control
        ref={inputRef}
        value={displayValue}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        placeholder="XX-XXXXXXX"
        maxLength={11}
      />
    </Form.Group>
  );
};
