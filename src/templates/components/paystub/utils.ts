/**
 * Formats a number as currency
 */
export const formatCurrency = (amount: number): string => {
  // The sign leads the symbol: -$1,022.11, never $-1,022.11.
  const sign = amount < 0 ? '-' : '';
  return `${sign}$${Math.abs(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
};

/**
 * Formats a date string
 */
export const formatDate = (dateString: string): string => {
  // A bare 'YYYY-MM-DD' is parsed as UTC midnight by `new Date`, which renders as the
  // PREVIOUS day west of Greenwich. Read date-only values as local calendar dates so a
  // period printed on the stub matches the one the customer entered.
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateString ?? '').trim());
  const date = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
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
