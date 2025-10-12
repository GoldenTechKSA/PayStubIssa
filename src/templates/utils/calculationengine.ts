/**
 * Calculation Engine
 * Handles dynamic field calculations based on formulas
 */

import { FieldDefinition, CalculationContext } from '../types/templatetypes';

export class CalculationEngine {
  private static instance: CalculationEngine;

  private constructor() {}

  static getInstance(): CalculationEngine {
    if (!CalculationEngine.instance) {
      CalculationEngine.instance = new CalculationEngine();
    }
    return CalculationEngine.instance;
  }

  /**
   * Calculate field value based on formula
   */
  calculate(formula: string, context: CalculationContext): number {
    try {
      // Replace field references with actual values
      let expression = formula;
      
      // Replace field IDs with their values
      Object.keys(context.fields).forEach(fieldId => {
        const value = context.fields[fieldId];
        const numericValue = this.toNumber(value);
        expression = expression.replace(new RegExp(`\\b${fieldId}\\b`, 'g'), String(numericValue));
      });

      // Replace constants if provided
      if (context.constants) {
        Object.keys(context.constants).forEach(constant => {
          expression = expression.replace(new RegExp(`\\b${constant}\\b`, 'g'), String(context.constants![constant]));
        });
      }

      // Evaluate the expression
      return this.evaluateExpression(expression);
    } catch (error) {
      console.error(`Calculation error for formula "${formula}":`, error);
      return 0;
    }
  }

  /**
   * Calculate all dependent fields in order
   */
  calculateDependentFields(
    fields: FieldDefinition[],
    data: Record<string, any>
  ): Record<string, any> {
    const result = { ...data };
    const calculatedFields = fields.filter(f => f.calculation);
    
    // Sort fields by dependency order
    const sortedFields = this.topologicalSort(calculatedFields, fields);
    
    // Calculate each field in order
    sortedFields.forEach(field => {
      if (field.calculation) {
        const context: CalculationContext = {
          fields: result
        };
        result[field.field_id] = this.calculate(field.calculation, context);
      }
    });

    return result;
  }

  /**
   * Topological sort for field dependencies
   */
  private topologicalSort(
    calculatedFields: FieldDefinition[],
    allFields: FieldDefinition[]
  ): FieldDefinition[] {
    const fieldMap = new Map(allFields.map(f => [f.field_id, f]));
    const visited = new Set<string>();
    const result: FieldDefinition[] = [];

    const visit = (field: FieldDefinition) => {
      if (visited.has(field.field_id)) {
        return;
      }

      visited.add(field.field_id);

      if (field.calculation) {
        // Find dependencies
        const dependencies = this.extractDependencies(field.calculation);
        dependencies.forEach(depId => {
          const depField = fieldMap.get(depId);
          if (depField && depField.calculation) {
            visit(depField);
          }
        });
      }

      result.push(field);
    };

    calculatedFields.forEach(field => visit(field));

    return result;
  }

  /**
   * Extract field dependencies from formula
   */
  private extractDependencies(formula: string): string[] {
    const fieldIdPattern = /\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g;
    const matches = formula.match(fieldIdPattern) || [];
    return [...new Set(matches)].filter(id => isNaN(Number(id)));
  }

  /**
   * Evaluate mathematical expression safely
   */
  private evaluateExpression(expression: string): number {
    // Remove any potentially dangerous characters
    const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, '');
    
    try {
      // Use Function constructor for safe evaluation
      // This is safer than eval() but still requires sanitization
      const result = new Function(`return ${sanitized}`)();
      return typeof result === 'number' && !isNaN(result) ? result : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Convert value to number
   */
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

  /**
   * Validate formula syntax
   */
  validateFormula(formula: string, availableFields: string[]): { valid: boolean; error?: string } {
    try {
      // Check for valid field references
      const dependencies = this.extractDependencies(formula);
      const invalidFields = dependencies.filter(dep => !availableFields.includes(dep));
      
      if (invalidFields.length > 0) {
        return {
          valid: false,
          error: `Invalid field references: ${invalidFields.join(', ')}`
        };
      }

      // Try to evaluate with dummy values
      const dummyContext: CalculationContext = {
        fields: Object.fromEntries(availableFields.map(f => [f, 1]))
      };
      
      this.calculate(formula, dummyContext);

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Invalid formula'
      };
    }
  }

  /**
   * Get calculation chain for a field
   */
  getCalculationChain(fieldId: string, fields: FieldDefinition[]): string[] {
    const field = fields.find(f => f.field_id === fieldId);
    if (!field || !field.calculation) {
      return [];
    }

    const chain: string[] = [fieldId];
    const dependencies = this.extractDependencies(field.calculation);

    dependencies.forEach(dep => {
      const depChain = this.getCalculationChain(dep, fields);
      chain.push(...depChain);
    });

    return [...new Set(chain)];
  }
}

// Export singleton instance
export const calculationEngine = CalculationEngine.getInstance();