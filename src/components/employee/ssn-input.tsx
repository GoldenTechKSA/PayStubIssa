import React, { useState, useEffect, useRef } from 'react';
import { Form, Col } from 'react-bootstrap';

interface SSNInputProps {
  value: string; // Stores the actual digits
  onChange: (value: string) => void;
}

export const SSNInput: React.FC<SSNInputProps> = ({ value, onChange }) => {
  const [displayValue, setDisplayValue] = useState<string>('');
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Format raw SSN value to display format (XXX-XX-XXXX) with actual digits
  const formatSSNWithDigits = (rawValue: string): string => {
    const digitsOnly = rawValue.replace(/\D/g, '').substring(0, 9);
    if (digitsOnly.length <= 3) {
      return digitsOnly;
    } else if (digitsOnly.length <= 5) {
      return `${digitsOnly.substring(0, 3)}-${digitsOnly.substring(3)}`;
    } else {
      return `${digitsOnly.substring(0, 3)}-${digitsOnly.substring(3, 5)}-${digitsOnly.substring(5)}`;
    }
  };

  // Create masked display (XXX-XX-XXXX with X's)
  const createMaskedDisplay = (digitCount: number): string => {
    if (digitCount === 0) return '';
    if (digitCount <= 3) {
      return 'X'.repeat(digitCount);
    } else if (digitCount <= 5) {
      return `XXX-${'X'.repeat(digitCount - 3)}`;
    } else {
      const lastPartLength = Math.min(digitCount - 5, 4);
      return `XXX-XX-${'X'.repeat(lastPartLength)}`;
    }
  };

  // Update display based on current state
  useEffect(() => {
    const cleanValue = value.replace(/\D/g, '');
    const digitCount = cleanValue.length;
    
    if (digitCount === 9) {
      // Complete - show masked version
      setIsComplete(true);
      setDisplayValue('XXX-XX-XXXX');
    } else {
      // Incomplete - show actual digits with formatting
      setIsComplete(false);
      setDisplayValue(formatSSNWithDigits(value));
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
      setDisplayValue('XXX-XX-XXXX');
    } else {
      setDisplayValue(formatSSNWithDigits(limitedDigits));
    }
  };

  const handleInputFocus = () => {
    // If input is complete and user focuses, show actual digits temporarily
    if (isComplete && value.length === 9) {
      setDisplayValue(formatSSNWithDigits(value));
    }
  };

  const handleInputBlur = () => {
    // When user leaves the field and it's complete, mask it again
    if (value.length === 9) {
      setDisplayValue('XXX-XX-XXXX');
      setIsComplete(true);
    }
  };

  return (
    <Form.Group as={Col} controlId="ssnInput">
      <Form.Label className="label_fontsize">Enter employee SSN</Form.Label>
      <Form.Control
        ref={inputRef}
        value={displayValue}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        maxLength={11} // XXX-XX-XXXX = 11 characters
      />
    </Form.Group>
  );
};
