// Template System Type Definitions
// Defines the structure for dynamic paystub templates
export interface TemplateMetadata {
  template_id: string;
  title?: string;
  version?: string;
  description?: string;
  category?: string;
}

export interface FieldDefinition {
  field_id: string;
  source?: string;
  label?: string;
  data_type?: 'image' | 'string' | 'number' | 'currency' | 'date' | 'percentage' | 'email' | 'phone';
  format?: string;
  // position block added so renderer and templates can use order/row/column
  position?: {
    section?: string;
    order?: number | string;
    row?: number | string;     // used to map a field under a column header
    column?: number | string;
  };
  order?: number;        // legacy convenience (not required)
  row?: number;          // legacy convenience
  styling?: string;
  calculation?: string;
  defaultValue?: any;
  required?: boolean;
  editable?: boolean;
  validation?: { min?: number; max?: number; pattern?: string; };
}

export interface ColumnDefinition {
  id?: string | number;
  layout_type?: 'grid' | 'table' | 'flex' | 'stack';
  styling?: string;
  width?: string | number;
  headers?: string[];                // new: column-specific table headers
  bgColor?: string;
  tableClass?: string;
  fields: FieldDefinition[];
}

export interface SectionDefinition {
  section_id: string;
  title?: string;
  order: number;
  layout_type: 'grid' | 'table' | 'flex' | 'stack';
  columns: ColumnDefinition[];    // required now
  styling?: string;
  visible?: boolean;
}

export interface TemplateConfiguration {
  metadata: TemplateMetadata;
  sections: SectionDefinition[];
  styling?: { primaryColor?: string; backgroundColor?: string; fontFamily?: string; headerBackground?: string; };
  layout?: { maxWidth?: string; padding?: string; margin?: string; };
}

export interface TemplateRegistry {
  templates: TemplateMetadata[];
  version: string;
  last_updated: string;
}

export interface PaystubData {
  [field_id: string]: any;
}

export interface CalculationContext {
  fields: Record<string, any>;
  constants?: Record<string, number>;
  functions?: Record<string, Function>;
}

export type FieldFormatter = (value: any, field: FieldDefinition) => string;
export type FieldValidator = (value: any, field: FieldDefinition) => boolean | string;
export type CalculationEngine = (formula: string, context: CalculationContext) => number;