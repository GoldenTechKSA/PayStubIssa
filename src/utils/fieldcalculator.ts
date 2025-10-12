import { TemplateData } from '../components3col/types';

export const calculateField = (expression: string,   data: TemplateData): number => {
  try {
    if (expression.startsWith('sum(')) {
      const match = expression.match(/sum\(([^)]+)\)/);
      if (!match) return 0;
      
      const arrayPath = match[1];
      const array = getNestedValue(data, arrayPath);
      if (Array.isArray(array)) {
        return array.reduce((sum, item) => {
          const value = typeof item === 'object' ? 
            (item.amount || item.value || 0) : 
            item;
          return sum + (parseFloat(value as string) || 0);
        }, 0);
      }
      return 0;
    }
    
    let evalExpression = expression;
    const fieldRegex = /[a-zA-Z_][a-zA-Z0-9_]*/g;
    const fields = expression.match(fieldRegex) || [];
    
    for (const field of fields) {
      if (field !== 'sum') {
        const fieldValue = getNestedValue(data, field);
        const numericValue = parseFloat(fieldValue as string) || 0;
        evalExpression = evalExpression.replace(new RegExp(`\\b${field}\\b`, 'g'), numericValue.toString());
      }
    }
    
    return Function('"use strict"; return (' + evalExpression + ')')();
  } catch (error) {
    console.error('Calculation error:', error);
    return 0;
  }
};

const getNestedValue = (obj: TemplateData, path: string): any => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
};