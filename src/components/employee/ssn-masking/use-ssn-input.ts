import { useCallback, useEffect, useState } from 'react';

interface UseSSNInputReturn {
  displayValue: string;
  actualValue: string;
  handleChange: (value: string, onValueChange: (newValue: string) => void) => void;
  isComplete: boolean;
  isValid: boolean;
}

export const useSSNInput = (controlledValue: string = ''): UseSSNInputReturn => {
  // Use the controlled value directly, no internal state
  const actualValue = controlledValue;

  // Format SSN for display with masking
  const formatSSNForDisplay = useCallback((ssn: string): string => {
    // Remove all non-digits
    const digits = ssn.replace(/\D/g, '');
    
    if (digits.length === 0) return '';
    
    let formatted = '';
    
    // First 3 digits - show as XXX when complete
    if (digits.length <= 3) {
      formatted = digits;
    } else {
      formatted = 'XXX';
    }
    
    // Add hyphen after first 3 digits
    if (digits.length > 3) {
      // Middle 2 digits - show as XX when complete
      if (digits.length <= 5) {
        formatted += `-${digits.slice(3)}`;
      } else {
        formatted += '-XX';
      }
    }
    
    // Add second hyphen after first 5 digits
    if (digits.length > 5) {
      // Last 4 digits - always show actual digits
      formatted += `-${digits.slice(5, 9)}`;
    }
    
    return formatted;
  }, []);

  // Validate SSN format
  const validateSSN = useCallback((ssn: string): boolean => {
    const digits = ssn.replace(/\D/g, '');
    return digits.length === 9 && 
           !['000000000', '123456789'].includes(digits) && // Basic invalid patterns
           digits.slice(0, 3) !== '000' && // Area number cannot be 000
           digits.slice(3, 5) !== '00' && // Group number cannot be 00
           digits.slice(5, 9) !== '0000'; // Serial number cannot be 0000
  }, []);

  const handleChange = useCallback((value: string, onValueChange: (newValue: string) => void) => {
    // Remove all non-digits and limit to 9 digits
    const digits = value.replace(/\D/g, '').slice(0, 9);
    // Call the parent's onChange immediately with the new digits
    onValueChange(digits);
  }, []);

  return {
    displayValue: formatSSNForDisplay(actualValue),
    actualValue,
    handleChange,
    isComplete: actualValue.length === 9,
    isValid: validateSSN(actualValue)
  };
};