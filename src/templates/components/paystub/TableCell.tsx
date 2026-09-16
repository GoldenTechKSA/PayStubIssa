// Style Guide for table cells:
// the standard css properties can be applied to style the cell
// fontSize is 11px by default, overridable via style prop in xml config
// fontWeight is 500 by default for label, normal for value, overridable via style prop in xml config
// textAlign is right by default for value, overridable via style prop in xml config
import React from 'react';

import { PaystubModel } from 'assets/data/pay-stub-details';
import type { TableCellConfig, CellFormat } from './types';
import { formatCurrency, formatNumber, formatDate } from './utils';

interface TableCellProps {
  config: TableCellConfig;
  data: PaystubModel;
}

// Helper: Apply a presentation format to an already-resolved value.
// Numbers are formatted; non-numeric input is passed through unchanged so labels survive.
const applyFormat = (raw: string, format: CellFormat | undefined): string => {
  switch (format) {
    case 'currency': {
      const num = Number(raw);
      return isNaN(num) ? raw : formatCurrency(num);
    }
    case 'number': {
      const num = Number(raw);
      return isNaN(num) ? raw : formatNumber(num);
    }
    case 'date':
      return formatDate(raw);
    case 'text':
    case undefined:
    default:
      return raw;
  }
};

// Helper: Safely get nested property value from data object using a path like "payment.grossPay"
const getNestedValue = (obj: PaystubModel, path: string): string => {
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
    // An empty or blank field is absent, not zero: Number('') is 0, which would print a
    // stray "0" wherever the customer left a text field (e.g. Employee ID) blank.
    if (value.trim() === '') {
      return '';
    }
    // Try to parse string as number (for values that might be stored as strings)
    const num = Number(value);
    return isNaN(num) ? value : num.toString();
  }
  // Fallback for boolean or other types
  return String(value);
};

// Helper: Resolve a nested path to its RAW string value (no numeric coercion,
// no '0' fallback). Used for image sources where '' must stay '' so a missing
// logo renders nothing rather than a broken image.
const getRawValue = (obj: PaystubModel, path: string): string => {
  const keys = path.split('.');
  let value: unknown = obj;
  for (const key of keys) {
    if (value == null || typeof value !== 'object') return '';
    value = (value as Record<string, unknown>)[key];
  }
  return value == null ? '' : String(value);
};

// Helper: Only treat a resolved value as a real image source. Guards against
// empty values and seed placeholders (e.g. "CompanyLogoHere") that would
// otherwise render as a broken <img>.
const isRenderableImage = (src: string): boolean =>
  /^data:image\//i.test(src) ||
  /^https?:\/\//i.test(src) ||
  /\.(png|jpe?g|gif|svg|webp)$/i.test(src);

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
    // Static values: literal label, returned as-is (no formatting)
    if (config.type === 'static') {
      return config.value ?? '';
    }
    // Substitute values: replace {path.to.property} with data values, then apply format
    if (config.type === 'substitute' && config.value) {
      const resolved = config.value.replace(/\{([^}]+)\}/g, (_, path) => {
        return getNestedValue(data, path.trim());
      });
      return applyFormat(resolved, config.format);
    }
    // Calculated values: parse placeholders, evaluate arithmetic, then format
    if (config.type === 'calculated' && config.formula) {
      try {
        // Step 1: Replace all {path.to.property} placeholders with numeric values
        // Each placeholder must have its own braces: {payment.grossPay} + {payment.federalTax}
        const evaluatedFormula = config.formula.replace(/\{([^}]+)\}/g, (_, path) => {
          return getNestedValue(data, path.trim());
        });
        // Step 2: Safely evaluate the resulting arithmetic expression
        const result = safeEvaluate(evaluatedFormula);
        // Step 3: Format. Calculated cells default to currency for back-compat.
        return applyFormat(String(result), config.format ?? 'currency');
      } catch (error) {
        console.error(`Error evaluating formula for cell ${config.id}:`, error);
        return 'Error';
      }
    }
    // Fallback
    return config.value ?? '';
  };

  const colSpan = config.colspan && config.colspan > 1 ? config.colspan : undefined;

  // Image cells (e.g. company logo): resolve {path} in `value` to an image src
  // and render an <img>. textAlign is lifted to the <td> (so the logo can be
  // centered/right-aligned); the remaining style sizes the image itself.
  // A non-renderable/empty src yields an empty cell — never a broken image.
  if (config.type === 'image') {
    const src = config.value
      ? config.value.replace(/\{([^}]+)\}/g, (_, path) => getRawValue(data, path.trim()))
      : '';
    const { textAlign, ...imgStyle } = config.style ?? {};
    const tdStyle: React.CSSProperties = textAlign ? { textAlign } : {};
    if (!isRenderableImage(src)) {
      return <td style={tdStyle} colSpan={colSpan} />;
    }
    const finalImgStyle: React.CSSProperties = { maxHeight: '60px', maxWidth: '180px', objectFit: 'contain', ...imgStyle };
    return (
      <td style={tdStyle} colSpan={colSpan}>
        <img src={src} alt={config.id || 'logo'} style={finalImgStyle} />
      </td>
    );
  }

  const defaultValueStyle: React.CSSProperties = { whiteSpace: 'nowrap' };
  const valueStyle: React.CSSProperties = { ...defaultValueStyle, ...config.style };

  return <td style={valueStyle} colSpan={colSpan}>{getValue()}</td>;
};

export default TableCell;