/**
 * Template System Test Suite
 * Comprehensive tests for the dynamic paystub template system
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { TemplateLoader } from '../templates/utils/templateloader';
import { CalculationEngine } from '../templates/utils/calculationengine';
import { FieldFormatter } from '../templates/utils/fieldformatter';
import { TemplateConfiguration, FieldDefinition } from '../templates/types/templatetypes';

describe('TemplateLoader', () => {
  let loader: TemplateLoader;

  beforeEach(() => {
    loader = TemplateLoader.getInstance();
    loader.clearCache();
  });

  describe('loadRegistry', () => {
    it('should load template registry successfully', async () => {
      const registry = await loader.loadRegistry();
      expect(registry).toBeDefined();
      expect(registry.templates).toBeInstanceOf(Array);
      expect(registry.version).toBeDefined();
    });

    it('should cache registry after first load', async () => {
      const registry1 = await loader.loadRegistry();
      const registry2 = await loader.loadRegistry();
      expect(registry1).toBe(registry2);
    });
  });

  describe('loadTemplate', () => {
    it('should load valid template configuration', async () => {
      const config = await loader.loadTemplate('classic_blue');
      expect(config).toBeDefined();
      expect(config?.metadata.template_id).toBe('classic_blue');
      expect(config?.sections).toBeInstanceOf(Array);
      expect(config?.fields).toBeInstanceOf(Array);
    });

    it('should cache loaded templates', async () => {
      const config1 = await loader.loadTemplate('classic_blue');
      const config2 = await loader.loadTemplate('classic_blue');
      expect(config1).toBe(config2);
    });

    it('should return null for non-existent template', async () => {
      const config = await loader.loadTemplate('non_existent');
      expect(config).toBeNull();
    });
  });

  describe('validateTemplate', () => {
    it('should validate correct template configuration', async () => {
      const config = await loader.loadTemplate('classic_blue');
      if (config) {
        const validation = loader.validateTemplate(config);
        expect(validation.valid).toBe(true);
        expect(validation.errors).toHaveLength(0);
      }
    });

    it('should detect missing template_id', () => {
      const invalidConfig: any = {
        metadata: {},
        sections: [{ section_id: 'test', title: 'Test', order: 1, layout_type: 'grid' }],
        fields: [{ field_id: 'test', label: 'Test', data_type: 'string', position: { section: 'test', order: 1 } }],
        styling: {}
      };
      const validation = loader.validateTemplate(invalidConfig);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Template must have a valid template_id');
    });

    it('should detect missing sections', () => {
      const invalidConfig: any = {
        metadata: { template_id: 'test' },
        sections: [],
        fields: [],
        styling: {}
      };
      const validation = loader.validateTemplate(invalidConfig);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Template must have at least one section');
    });

    it('should detect invalid section references in fields', () => {
      const invalidConfig: TemplateConfiguration = {
        metadata: { template_id: 'test', title: 'Test', version: '1.0', description: 'Test', category: 'test' },
        sections: [{ section_id: 'header', title: 'Header', order: 1, layout_type: 'grid' }],
        fields: [{
          field_id: 'test_field',
          label: 'Test',
          data_type: 'string',
          position: { section: 'invalid_section', order: 1 }
        }],
        styling: {}
      };
      const validation = loader.validateTemplate(invalidConfig);
      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.includes('non-existent section'))).toBe(true);
    });
  });

  describe('getTemplatesByCategory', () => {
    it('should filter templates by category', async () => {
      const templates = await loader.getTemplatesByCategory('standard');
      expect(templates).toBeInstanceOf(Array);
      templates.forEach(t => expect(t.category).toBe('standard'));
    });

    it('should return empty array for non-existent category', async () => {
      const templates = await loader.getTemplatesByCategory('non_existent');
      expect(templates).toHaveLength(0);
    });
  });
});

describe('CalculationEngine', () => {
  let engine: CalculationEngine;

  beforeEach(() => {
    engine = CalculationEngine.getInstance();
  });

  describe('calculate', () => {
    it('should calculate simple addition', () => {
      const result = engine.calculate('10 + 20', { fields: {} });
      expect(result).toBe(30);
    });

    it('should calculate simple subtraction', () => {
      const result = engine.calculate('50 - 20', { fields: {} });
      expect(result).toBe(30);
    });

    it('should calculate simple multiplication', () => {
      const result = engine.calculate('5 * 6', { fields: {} });
      expect(result).toBe(30);
    });

    it('should calculate simple division', () => {
      const result = engine.calculate('60 / 2', { fields: {} });
      expect(result).toBe(30);
    });

    it('should handle parentheses', () => {
      const result = engine.calculate('(10 + 20) * 2', { fields: {} });
      expect(result).toBe(60);
    });

    it('should substitute field values', () => {
      const result = engine.calculate('salary * 0.22', {
        fields: { salary: 5000 }
      });
      expect(result).toBe(1100);
    });

    it('should handle multiple field references', () => {
      const result = engine.calculate('base + bonus - deductions', {
        fields: { base: 5000, bonus: 1000, deductions: 800 }
      });
      expect(result).toBe(5200);
    });

    it('should handle missing field references as 0', () => {
      const result = engine.calculate('salary + bonus', {
        fields: { salary: 5000 }
      });
      expect(result).toBe(5000);
    });

    it('should use constants when provided', () => {
      const result = engine.calculate('salary * TAX_RATE', {
        fields: { salary: 5000 },
        constants: { TAX_RATE: 0.15 }
      });
      expect(result).toBe(750);
    });
  });

  describe('calculateDependentFields', () => {
    it('should calculate all dependent fields in correct order', () => {
      const fields: FieldDefinition[] = [
        {
          field_id: 'base',
          label: 'Base',
          data_type: 'currency',
          position: { section: 'test', order: 1 },
          defaultValue: 5000
        },
        {
          field_id: 'bonus',
          label: 'Bonus',
          data_type: 'currency',
          position: { section: 'test', order: 2 },
          defaultValue: 1000
        },
        {
          field_id: 'gross',
          label: 'Gross',
          data_type: 'currency',
          position: { section: 'test', order: 3 },
          calculation: 'base + bonus'
        },
        {
          field_id: 'net',
          label: 'Net',
          data_type: 'currency',
          position: { section: 'test', order: 4 },
          calculation: 'gross * 0.8'
        }
      ];

      const data = { base: 5000, bonus: 1000 };
      const result = engine.calculateDependentFields(fields, data);

      expect(result.gross).toBe(6000);
      expect(result.net).toBe(4800);
    });

    it('should handle complex dependency chains', () => {
      const fields: FieldDefinition[] = [
        {
          field_id: 'hours',
          label: 'Hours',
          data_type: 'number',
          position: { section: 'test', order: 1 },
          defaultValue: 40
        },
        {
          field_id: 'rate',
          label: 'Rate',
          data_type: 'currency',
          position: { section: 'test', order: 2 },
          defaultValue: 25
        },
        {
          field_id: 'gross',
          label: 'Gross',
          data_type: 'currency',
          position: { section: 'test', order: 3 },
          calculation: 'hours * rate'
        },
        {
          field_id: 'tax',
          label: 'Tax',
          data_type: 'currency',
          position: { section: 'test', order: 4 },
          calculation: 'gross * 0.22'
        },
        {
          field_id: 'net',
          label: 'Net',
          data_type: 'currency',
          position: { section: 'test', order: 5 },
          calculation: 'gross - tax'
        }
      ];

      const data = { hours: 40, rate: 25 };
      const result = engine.calculateDependentFields(fields, data);

      expect(result.gross).toBe(1000);
      expect(result.tax).toBe(220);
      expect(result.net).toBe(780);
    });
  });

  describe('validateFormula', () => {
    it('should validate correct formula', () => {
      const validation = engine.validateFormula('salary * 0.22', ['salary']);
      expect(validation.valid).toBe(true);
    });

    it('should detect invalid field references', () => {
      const validation = engine.validateFormula('salary + bonus', ['salary']);
      expect(validation.valid).toBe(false);
      expect(validation.error).toContain('Invalid field references: bonus');
    });

    it('should accept numeric literals', () => {
      const validation = engine.validateFormula('10 + 20', []);
      expect(validation.valid).toBe(true);
    });
  });
});

describe('FieldFormatter', () => {
  let formatter: FieldFormatter;

  beforeEach(() => {
    formatter = FieldFormatter.getInstance();
  });

  describe('format - currency', () => {
    it('should format currency with default format', () => {
      const field: FieldDefinition = {
        field_id: 'salary',
        label: 'Salary',
        data_type: 'currency',
        position: { section: 'test', order: 1 }
      };
      const result = formatter.format(1234.56, field);
      expect(result).toBe('$1,234.56');
    });

    it('should format currency with $0.00 format', () => {
      const field: FieldDefinition = {
        field_id: 'salary',
        label: 'Salary',
        data_type: 'currency',
        format: '$0.00',
        position: { section: 'test', order: 1 }
      };
      const result = formatter.format(1234.56, field);
      expect(result).toBe('$1234.56');
    });
  });

  describe('format - number', () => {
    it('should format number with 2 decimals', () => {
      const field: FieldDefinition = {
        field_id: 'hours',
        label: 'Hours',
        data_type: 'number',
        format: '0.00',
        position: { section: 'test', order: 1 }
      };
      const result = formatter.format(42.5, field);
      expect(result).toBe('42.50');
    });

    it('should format number with 0 decimals', () => {
      const field: FieldDefinition = {
        field_id: 'hours',
        label: 'Hours',
        data_type: 'number',
        format: '0',
        position: { section: 'test', order: 1 }
      };
      const result = formatter.format(42.7, field);
      expect(result).toBe('43');
    });
  });

  describe('format - percentage', () => {
    it('should format percentage with 2 decimals', () => {
      const field: FieldDefinition = {
        field_id: 'rate',
        label: 'Rate',
        data_type: 'percentage',
        format: '0.00%',
        position: { section: 'test', order: 1 }
      };
      const result = formatter.format(15.75, field);
      expect(result).toBe('15.75%');
    });
  });

  describe('format - date', () => {
    it('should format date as MM/DD/YYYY', () => {
      const field: FieldDefinition = {
        field_id: 'date',
        label: 'Date',
        data_type: 'date',
        format: 'MM/DD/YYYY',
        position: { section: 'test', order: 1 }
      };
      const result = formatter.format('2025-01-15', field);
      expect(result).toBe('01/15/2025');
    });
  });

  describe('validate', () => {
    it('should validate required field', () => {
      const field: FieldDefinition = {
        field_id: 'name',
        label: 'Name',
        data_type: 'string',
        position: { section: 'test', order: 1 },
        required: true
      };
      
      const validResult = formatter.validate('John Doe', field);
      expect(validResult.valid).toBe(true);
      
      const invalidResult = formatter.validate('', field);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.error).toContain('required');
    });

    it('should validate min value', () => {
      const field: FieldDefinition = {
        field_id: 'hours',
        label: 'Hours',
        data_type: 'number',
        position: { section: 'test', order: 1 },
        validation: { min: 0 }
      };
      
      const validResult = formatter.validate(10, field);
      expect(validResult.valid).toBe(true);
      
      const invalidResult = formatter.validate(-5, field);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.error).toContain('at least');
    });

    it('should validate max value', () => {
      const field: FieldDefinition = {
        field_id: 'hours',
        label: 'Hours',
        data_type: 'number',
        position: { section: 'test', order: 1 },
        validation: { max: 100 }
      };
      
      const validResult = formatter.validate(50, field);
      expect(validResult.valid).toBe(true);
      
      const invalidResult = formatter.validate(150, field);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.error).toContain('at most');
    });
  });
});

describe('Integration Tests', () => {
  it('should load and validate all default templates', async () => {
    const loader = TemplateLoader.getInstance();
    const templates = await loader.getAvailableTemplates();
    
    for (const template of templates) {
      const config = await loader.loadTemplate(template.template_id);
      if (config) {
        const validation = loader.validateTemplate(config);
        expect(validation.valid).toBe(true);
      }
    }
  });

  it('should calculate all fields in a template', async () => {
    const loader = TemplateLoader.getInstance();
    const engine = CalculationEngine.getInstance();
    
    const config = await loader.loadTemplate('classic_blue');
    if (config) {
      const initialData: Record<string, any> = {};
      config.fields.forEach(field => {
        initialData[field.field_id] = field.defaultValue;
      });
      
      const calculatedData = engine.calculateDependentFields(config.fields, initialData);
      
      // Verify all calculated fields have values
      config.fields.forEach(field => {
        if (field.calculation) {
          expect(calculatedData[field.field_id]).toBeDefined();
          expect(typeof calculatedData[field.field_id]).toBe('number');
        }
      });
    }
  });

  it('should format all field types correctly', () => {
    const formatter = FieldFormatter.getInstance();
    
    const testCases = [
      {
        field: {
          field_id: 'currency_test',
          label: 'Currency',
          data_type: 'currency' as const,
          position: { section: 'test', order: 1 }
        },
        value: 1234.56,
        expected: '$1,234.56'
      },
      {
        field: {
          field_id: 'number_test',
          label: 'Number',
          data_type: 'number' as const,
          format: '0.00',
          position: { section: 'test', order: 1 }
        },
        value: 42.5,
        expected: '42.50'
      },
      {
        field: {
          field_id: 'percentage_test',
          label: 'Percentage',
          data_type: 'percentage' as const,
          format: '0.00%',
          position: { section: 'test', order: 1 }
        },
        value: 15.75,
        expected: '15.75%'
      }
    ];

    testCases.forEach(testCase => {
      const result = formatter.format(testCase.value, testCase.field);
      expect(result).toBe(testCase.expected);
    });
  });
});

describe('Error Handling', () => {
  it('should handle division by zero gracefully', () => {
    const engine = CalculationEngine.getInstance();
    const result = engine.calculate('10 / 0', { fields: {} });
    // Should return Infinity or handle gracefully
    expect(typeof result).toBe('number');
  });

  it('should handle invalid calculation syntax', () => {
    const engine = CalculationEngine.getInstance();
    const result = engine.calculate('10 + + 20', { fields: {} });
    expect(result).toBe(0); // Should return 0 on error
  });

  it('should handle null and undefined values in formatting', () => {
    const formatter = FieldFormatter.getInstance();
    const field: FieldDefinition = {
      field_id: 'test',
      label: 'Test',
      data_type: 'currency',
      position: { section: 'test', order: 1 }
    };

    expect(formatter.format(null, field)).toBe('-');
    expect(formatter.format(undefined, field)).toBe('-');
  });

  it('should handle malformed template configuration', () => {
    const loader = TemplateLoader.getInstance();
    const malformedConfig: any = {
      // Missing required fields
      metadata: {},
      sections: null,
      fields: undefined
    };

    const validation = loader.validateTemplate(malformedConfig);
    expect(validation.valid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
  });
});

describe('Performance Tests', () => {
  it('should cache templates efficiently', async () => {
    const loader = TemplateLoader.getInstance();
    loader.clearCache();

    const startTime1 = Date.now();
    await loader.loadTemplate('classic_blue');
    const firstLoadTime = Date.now() - startTime1;

    const startTime2 = Date.now();
    await loader.loadTemplate('classic_blue');
    const cachedLoadTime = Date.now() - startTime2;

    // Cached load should be significantly faster
    expect(cachedLoadTime).toBeLessThan(firstLoadTime);
  });

  it('should handle large calculation chains efficiently', () => {
    const engine = CalculationEngine.getInstance();
    
    // Create a chain of 100 dependent calculations
    const fields: FieldDefinition[] = [
      {
        field_id: 'base',
        label: 'Base',
        data_type: 'number',
        position: { section: 'test', order: 1 },
        defaultValue: 1
      }
    ];

    for (let i = 1; i < 100; i++) {
      fields.push({
        field_id: `calc_${i}`,
        label: `Calc ${i}`,
        data_type: 'number',
        position: { section: 'test', order: i + 1 },
        calculation: i === 1 ? 'base + 1' : `calc_${i - 1} + 1`
      });
    }

    const startTime = Date.now();
    const result = engine.calculateDependentFields(fields, { base: 1 });
    const executionTime = Date.now() - startTime;

    expect(result.calc_99).toBe(100);
    expect(executionTime).toBeLessThan(1000); // Should complete in under 1 second
  });
});

describe('Edge Cases', () => {
  it('should handle very large currency values', () => {
    const formatter = FieldFormatter.getInstance();
    const field: FieldDefinition = {
      field_id: 'large_value',
      label: 'Large Value',
      data_type: 'currency',
      position: { section: 'test', order: 1 }
    };

    const result = formatter.format(999999999.99, field);
    expect(result).toContain(')');
    expect(result).toContain('999,999,999.99');
  });

  it('should handle very small decimal values', () => {
    const formatter = FieldFormatter.getInstance();
    const field: FieldDefinition = {
      field_id: 'small_value',
      label: 'Small Value',
      data_type: 'number',
      format: '0.00',
      position: { section: 'test', order: 1 }
    };

    const result = formatter.format(0.001, field);
    expect(result).toBe('0.00');
  });

  it('should handle negative currency values', () => {
    const formatter = FieldFormatter.getInstance();
    const field: FieldDefinition = {
      field_id: 'negative',
      label: 'Negative',
      data_type: 'currency',
      position: { section: 'test', order: 1 }
    };

    const result = formatter.format(-1234.56, field);
    expect(result).toContain('-');
    expect(result).toContain('1,234.56');
  });

  it('should handle circular dependencies in calculations', () => {
    const engine = CalculationEngine.getInstance();
    
    // Create circular dependency: A depends on B, B depends on A
    const fields: FieldDefinition[] = [
      {
        field_id: 'field_a',
        label: 'Field A',
        data_type: 'number',
        position: { section: 'test', order: 1 },
        calculation: 'field_b + 1'
      },
      {
        field_id: 'field_b',
        label: 'Field B',
        data_type: 'number',
        position: { section: 'test', order: 2 },
        calculation: 'field_a + 1'
      }
    ];

    // Should handle gracefully without infinite loop
    const result = engine.calculateDependentFields(fields, {});
    expect(typeof result.field_a).toBe('number');
    expect(typeof result.field_b).toBe('number');
  });

  it('should handle empty template configuration', () => {
    const loader = TemplateLoader.getInstance();
    const emptyConfig: TemplateConfiguration = {
      metadata: {
        template_id: 'empty',
        title: 'Empty',
        version: '1.0',
        description: 'Empty template',
        category: 'test'
      },
      sections: [],
      fields: [],
      styling: {}
    };

    const validation = loader.validateTemplate(emptyConfig);
    expect(validation.valid).toBe(false);
  });

  it('should handle special characters in field values', () => {
    const formatter = FieldFormatter.getInstance();
    const field: FieldDefinition = {
      field_id: 'company',
      label: 'Company',
      data_type: 'string',
      position: { section: 'test', order: 1 }
    };

    const result = formatter.format('ABC & Co., Inc. <Ltd.>', field);
    expect(result).toBe('ABC & Co., Inc. <Ltd.>');
  });
});

// Export for use in other test files
export {
  TemplateLoader,
  CalculationEngine,
  FieldFormatter
};