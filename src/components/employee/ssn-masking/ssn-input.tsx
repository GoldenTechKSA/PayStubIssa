import React from 'react';
import { Form, Col } from 'react-bootstrap';
import { useSSNInput } from './use-ssn-input';
import './ssn-input.css';

interface SSNInputProps {
  value: string;
  onChange: (ssn: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  controlId?: string;
}

export const SSNInput: React.FC<SSNInputProps> = ({
  value,
  onChange,
  label = "Enter employee SSN",
  placeholder = "XXX-XX-XXXX",
  required = false,
  disabled = false,
  className = "",
  controlId = "ssnInput"
}) => {
  const {
    displayValue,
    actualValue,
    handleChange,
    isComplete,
    isValid
  } = useSSNInput(value);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (onChange) {
      handleChange(newValue, onChange);
    }
  };

  // Determine validation state
  const getValidationState = (): 'success' | 'error' | undefined => {
    if (actualValue.length === 0) return undefined;
    if (isComplete && isValid) return 'success';
    if (actualValue.length > 0 && (!isComplete || !isValid)) return 'error';
    return undefined;
  };

  const validationState = getValidationState();

  return (
    <Form.Group as={Col} controlId={controlId} className={`ssn-input-group ${className}`}>
      <Form.Label className="ssn-label">
        {label}
        {required && <span className="required-asterisk">*</span>}
      </Form.Label>
      
      <Form.Control
        type="text"
        value={displayValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`ssn-input ${validationState ? `ssn-input--${validationState}` : ''}`}
        maxLength={11} // XXX-XX-XXXX format
        autoComplete="off"
        data-testid="ssn-input"
      />
      
      {/* Validation feedback */}
      {validationState === 'error' && actualValue.length > 0 && (
        <Form.Text className="ssn-error-text">
          {!isComplete 
            ? `Please enter all 9 digits (${actualValue.length}/9 entered)`
            : 'Please enter a valid SSN'
          }
        </Form.Text>
      )}
      
      {validationState === 'success' && (
        <Form.Text className="ssn-success-text">
          ✓ Valid SSN entered
        </Form.Text>
      )}
      
      {/* Helper text */}
      <Form.Text className="ssn-helper-text">
        Format: XXX-XX-{actualValue.length > 5 ? actualValue.slice(5, 9) : 'XXXX'}
        {actualValue.length > 0 && ` (${actualValue.length}/9 digits)`}
      </Form.Text>
    </Form.Group>
  );
};