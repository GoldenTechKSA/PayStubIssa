// Style Guide for table cells:
// the standard css properties can be applied to style the cell
// fontSize is 11px by default, overridable via style prop in xml config
// fontWeight is 500 by default for label, normal for value, overridable via style prop in xml config
// textAlign is right by default for value, overridable via style prop in xml config
import React from 'react';
import { PayStubDetails } from 'assets/data/pay-stub-details';
import type { TableCellConfig, PaystubData } from './types';

interface TableCellProps {
  config: TableCellConfig;
  data: PayStubDetails;
}

// Helper: Safely get nested property value from PaystubData
const getNestedValue = (obj: PayStubDetails, path: string): string => {
  const keys = path.split('.');
  let value: unknown = obj;

  for (const key of keys) {
    // If value is null/undefined or not an object, we can't traverse further
    if (value == null || typeof value !== 'object') {
      return '0';
    }
    // Direct property access via index signature
    value = (value as Record<string, unknown>)[key];
  }
  // Handle the final resolved value
  if (value == null) {
    return '0';
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  if (typeof value === 'string') {
    // Try to parse string as number (for values that might be stored as strings)
    const num = Number(value);
    return isNaN(num) ? value : num.toString();
  }
  // Fallback for boolean or other types
  return String(value);
};

// Helper: Safe arithmetic evaluator - only allows numbers, operators, parentheses
const safeEvaluate = (expression: string): number => {
  // Remove whitespace for easier validation
  const expr = expression.replace(/\s+/g, '');
  // Strict whitelist: only allow digits, decimal points, operators, parentheses
  if (!/^[\d.+\-*/()]+$/.test(expr)) {
    throw new Error(`Invalid characters in formula: ${expression}`);
  }
  try {
    // Use Function constructor with strict mode (safer than eval when input is validated)
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${expr})`)();
    if (typeof result !== 'number' || !isFinite(result)) {
      throw new Error(`Invalid calculation result: ${result}`);
    }
    return result;
  } catch (e) {
    throw new Error(`Calculation error in "${expression}": ${e instanceof Error ? e.message : String(e)}`);
  }
};

// TableCell Component
export const TableCell: React.FC<TableCellProps> = ({ config, data }) => {
  const getValue = (): string => {
    // Static values: return as-is
    if (config.type === 'static') {
      return config.value ?? '';
    }
    // Substitute values: replace {path.to.property} with data values (no arithmetic)
    if (config.type === 'substitute' && config.value) {
      return config.value.replace(/\{([^}]+)\}/g, (_, path) => {
        return getNestedValue(data, path.trim());
      });
    }
    // Calculated values: parse placeholders, then evaluate arithmetic
    if (config.type === 'calculated' && config.formula) {
      try {
        // Step 1: Replace all {path.to.property} placeholders with numeric values
        // Each placeholder must have its own braces: {payment.grossPay} + {payment.federalTax}
        const evaluatedFormula = config.formula.replace(/\{([^}]+)\}/g, (_, path) => {
          return getNestedValue(data, path.trim());
        });
        // Step 2: Safely evaluate the resulting arithmetic expression
        const result = safeEvaluate(evaluatedFormula);
        // Step 3: Format as currency
        return `$${result.toFixed(2)}`;
      } catch (error) {
        console.error(`Error evaluating formula for cell ${config.id}:`, error);
        return 'Error';
      }
    }
    // Fallback
    return config.value ?? '';
  };

  const defaultValueStyle: React.CSSProperties = { whiteSpace: 'nowrap' };
  const valueStyle: React.CSSProperties = { ...defaultValueStyle, ...config.style };
  const colSpan = config.colspan && config.colspan > 1 ? config.colspan : undefined;

  return <td style={valueStyle} colSpan={colSpan}>{getValue()}</td>;
};

export default TableCell;