/**
 * Field Formatter Utility
 * Handles formatting of field values based on data type
 */

import { FieldDefinition } from '../types/templatetypes';

export class FieldFormatter {
  private static instance: FieldFormatter;

  private constructor() {}

  static getInstance(): FieldFormatter {
    if (!FieldFormatter.instance) {
      FieldFormatter.instance = new FieldFormatter();
    }
    return FieldFormatter.instance;
  }

  // Format value based on field definition
  format(value: any, field: FieldDefinition): string {
    if (value === null || value === undefined || value === '') {
      return '-';
    }

    switch (field.data_type) {
      case 'currency':
        return this.formatCurrency(value, field.format);
      case 'number':
        return this.formatNumber(value, field.format);
      case 'percentage':
        return this.formatPercentage(value, field.format);
      case 'date':
        return this.formatDate(value, field.format);
      case 'phone':
        return this.formatPhone(value);
      case 'email':
        return this.formatEmail(value);
      case 'image':
        return String(value);
      default:
        return String(value);
    }
  }

  // Format currency values
  private formatCurrency(value: any, format?: string): string {
    const numValue = this.toNumber(value);
    
    if (format === '$0.00') {
      return `$${numValue.toFixed(2)}`;
    }
    
    if (format === '$0,000.00') {
      return `$${numValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    
    // Default currency format
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numValue);
  }

  // Format number values
  private formatNumber(value: any, format?: string): string {
    const numValue = this.toNumber(value);
    
    if (format === '0.00') {
      return numValue.toFixed(2);
    }
    
    if (format === '0,000.00') {
      return numValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    
    if (format === '0') {
      return Math.round(numValue).toString();
    }
    
    // Default number format
    return numValue.toString();
  }

  // Format percentage values
  private formatPercentage(value: any, format?: string): string {
    const numValue = this.toNumber(value);
    
    if (format === '0.00%') {
      return `${numValue.toFixed(2)}%`;
    }
    
    if (format === '0%') {
      return `${Math.round(numValue)}%`;
    }
    
    // Default percentage format
    return `${numValue.toFixed(1)}%`;
  }

  // Format date values
  private formatDate(value: any, format?: string): string {
    let date: Date;
    
    if (value instanceof Date) {
      date = value;
    } else if (typeof value === 'string') {
      date = new Date(value);
    } else if (typeof value === 'number') {
      date = new Date(value);
    } else {
      return String(value);
    }
    
    if (isNaN(date.getTime())) {
      return String(value);
    }
    
    switch (format) {
      case 'MM/DD/YYYY':
        return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;
      
      case 'DD/MM/YYYY':
        return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
      
      case 'YYYY-MM-DD':
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      case 'MMM DD, YYYY':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      
      case 'MMMM DD, YYYY':
        return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      
      default:
        return date.toLocaleDateString('en-US');
    }
  }

  // Format phone numbers
  private formatPhone(value: any): string {
    const digits = String(value).replace(/\D/g, '');
    
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    
    if (digits.length === 11 && digits[0] === '1') {
      return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    
    return String(value);
  }

  // Format email addresses
  private formatEmail(value: any): string {
    return String(value).toLowerCase().trim();
  }

  // Convert value to number
  private toNumber(value: any): number {
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      const num = parseFloat(value.replace(/[^0-9.-]/g, ''));
      return isNaN(num) ? 0 : num;
    }
    return 0;
  }

  // Parse formatted value back to raw value
  parse(formattedValue: string, field: FieldDefinition): any {
    switch (field.data_type) {
      case 'currency':
      case 'number':
      case 'percentage':
        return this.toNumber(formattedValue);
      
      case 'date':
        return formattedValue;
      
      default:
        return formattedValue;
    }
  }

  // Validate field value
  validate(value: any, field: FieldDefinition): { valid: boolean; error?: string } {
    if (field.required && (value === null || value === undefined || value === '')) {
      return { valid: false, error: `${field.label} is required` };
    }

    if (field.validation) {
      const { min, max, pattern } = field.validation;
      
      if (min !== undefined && this.toNumber(value) < min) {
        return { valid: false, error: `${field.label} must be at least ${min}` };
      }
      
      if (max !== undefined && this.toNumber(value) > max) {
        return { valid: false, error: `${field.label} must be at most ${max}` };
      }
      
      if (pattern && typeof value === 'string') {
        const regex = new RegExp(pattern);
        if (!regex.test(value)) {
          return { valid: false, error: `${field.label} format is invalid` };
        }
      }
    }

    return { valid: true };
  }
}

// Export singleton instance
export const fieldFormatter = FieldFormatter.getInstance();