import type { PaystubData } from './types';

/**
 * Formats a number as currency
 */
export const formatCurrency = (amount: number): string => {
  return `$${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
};

/**
 * Formats a date string
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

/**
 * Calculates total deductions from payment data
 */
export const calculateTotalDeductions = (payment: PaystubData['payment']): number => {
  return (
    payment.federalTax +
    payment.stateTax +
    payment.socialSecurity +
    payment.medicare +
    payment.deductions
  );
};

/**
 * Validates that net pay equals gross pay minus deductions
 */
export const validateNetPay = (payment: PaystubData['payment']): boolean => {
  const calculatedNet = payment.grossPay - calculateTotalDeductions(payment);
  const difference = Math.abs(calculatedNet - payment.netPay);
  
  // Allow for small floating point differences (< $0.01)
  return difference < 0.01;
};

/**
 * Calculates tax rate as percentage
 */
export const calculateTaxRate = (tax: number, grossPay: number): number => {
  if (grossPay === 0) return 0;
  return (tax / grossPay) * 100;
};

/**
 * Sample data generator for testing
 */
export const generateSamplePaystubData = (overrides?: Partial<PaystubData>): PaystubData => {
  const defaultData: PaystubData = {
    company: {
      name: "Acme Corporation",
      address: "123 Business Street, New York, NY 10001",
      phone: "(555) 123-4567"
    },
    employee: {
      name: "John Doe",
      id: "EMP-12345",
      department: "Engineering"
    },
    payment: {
      grossPay: 5937.50,
      netPay: 3850.50,
      federalTax: 890.63,
      stateTax: 296.88,
      socialSecurity: 368.13,
      medicare: 86.09,
      deductions: 445.27
    },
    payPeriod: {
      start: "10/01/2025",
      end: "10/15/2025",
      payDate: "10/20/2025"
    }
  };

  return {
    ...defaultData,
    ...overrides,
    company: { ...defaultData.company, ...overrides?.company },
    employee: { ...defaultData.employee, ...overrides?.employee },
    payment: { ...defaultData.payment, ...overrides?.payment },
    payPeriod: { ...defaultData.payPeriod, ...overrides?.payPeriod }
  };
};

/**
 * Loads XML from a file or URL
 */
export const loadXMLFromFile = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      if (event.target?.result) {
        resolve(event.target.result as string);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    reader.readAsText(file);
  });
};

/**
 * Exports paystub data to JSON
 */
export const exportToJSON = (data: PaystubData): string => {
  return JSON.stringify(data, null, 2);
};

/**
 * Imports paystub data from JSON string
 */
export const importFromJSON = (jsonString: string): PaystubData => {
  try {
    const data = JSON.parse(jsonString);
    
    // Validate required fields
    if (!data.company || !data.employee || !data.payment || !data.payPeriod) {
      throw new Error('Invalid JSON structure: missing required fields');
    }
    
    return data as PaystubData;
  } catch (error) {
    throw new Error(`Failed to parse JSON: ${error}`);
  }
};

/**
 * Downloads XML configuration as a file
 */
export const downloadXML = (xmlString: string, filename: string = 'paystub-config.xml'): void => {
  const blob = new Blob([xmlString], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Downloads paystub data as JSON file
 */
export const downloadJSON = (data: PaystubData, filename: string = 'paystub-data.json'): void => {
  const jsonString = exportToJSON(data);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Prints the paystub (wrapper for window.print with styling)
 */
export const printPaystub = (): void => {
  // Add print-specific styles
  const printStyle = document.createElement('style');
  printStyle.textContent = `
    @media print {
      @page {
        margin: 0.5in;
        size: letter;
      }
      body {
        margin: 0;
        padding: 0;
      }
      button, .no-print {
        display: none !important;
      }
      .paystub-container {
        box-shadow: none !important;
      }
    }
  `;
  document.head.appendChild(printStyle);
  
  // Trigger print
  window.print();
  
  // Clean up
  setTimeout(() => {
    document.head.removeChild(printStyle);
  }, 1000);
};

/**
 * Validates email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates phone number format
 */
export const isValidPhone = (phone: string): boolean => {
  // Accepts formats like: (555) 123-4567, 555-123-4567, 5551234567
  const phoneRegex = /^[\d\s\-\(\)]+$/;
  const digitsOnly = phone.replace(/\D/g, '');
  return phoneRegex.test(phone) && digitsOnly.length === 10;
};

/**
 * Calculates year-to-date totals
 */
export const calculateYTD = (
  currentAmount: number,
  periodsCompleted: number,
  currentPeriod: number = 1
): number => {
  return currentAmount * (periodsCompleted + currentPeriod);
};

/**
 * Formats a number with thousand separators
 */
export const formatNumber = (value: number, decimals: number = 2): string => {
  return value
    .toFixed(decimals)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * Parses currency string to number
 */
export const parseCurrency = (currencyString: string): number => {
  const cleaned = currencyString.replace(/[$,\s]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Generates a unique ID for elements
 */
export const generateUniqueId = (prefix: string = 'id'): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Deep clones an object
 */
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Checks if two paystub data objects are equal
 */
export const arePaystubsEqual = (data1: PaystubData, data2: PaystubData): boolean => {
  return JSON.stringify(data1) === JSON.stringify(data2);
};