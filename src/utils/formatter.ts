import { FieldDefinition } from '../components3col/types';

export const formatValue = (value: any, field: FieldDefinition): string => {
  if (value === null || value === undefined) return '';
  
  const { data_type, format } = field;
  
  switch (data_type) {
    case 'currency': {
      const currencyValue = parseFloat(value);
      if (isNaN(currencyValue)) return String(value);
      
      const symbol = format?.includes('$') ? '$' : '';
      const decimals = format?.match(/\.(\d+)/);
      const decimalPlaces = decimals ? parseInt(decimals[1], 10) : 2;
      
      return symbol + currencyValue.toFixed(decimalPlaces).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
      
    case 'number': {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) return String(value);
      
      const numDecimals = format ? format.split('.')[1]?.length || 0 : 0;
      return numValue.toFixed(numDecimals);
    }
      
    case 'date': {
      if (!value) return '';
      
      const date = new Date(value);
      if (isNaN(date.getTime())) return String(value);
      
      if (format === 'MM/DD/YYYY') {
        return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;
      } else if (format === 'MMM DD, YYYY') {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
      }
      return date.toLocaleDateString();
    }
    
    case 'date_range': {
      if (!value || typeof value !== 'object') return String(value);
      
      const start = new Date(value.start);
      const end = new Date(value.end);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return String(value);
      
      if (format === 'MM/DD/YYYY - MM/DD/YYYY') {
        const startStr = `${String(start.getMonth() + 1).padStart(2, '0')}/${String(start.getDate()).padStart(2, '0')}/${start.getFullYear()}`;
        const endStr = `${String(end.getMonth() + 1).padStart(2, '0')}/${String(end.getDate()).padStart(2, '0')}/${end.getFullYear()}`;
        return `${startStr} - ${endStr}`;
      }
      return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
    }
    
    case 'image': {
      return String(value);
    }
    
    case 'string': {
      if (format === 'title') {
        return 'Pay Stub';
      } else if (format === 'masked') {
        if (typeof value === 'string' && value.length >= 4) {
          return `XXX-XX-${value.slice(-4)}`;
        }
        return 'XXX-XX-XXXX';
      }
      return String(value);
    }
      
    default:
      return String(value);
  }
};