/**
 * Template System Type Definitions
 * Defines the structure for dynamic paystub templates
 */

export interface TemplateMetadata {
  template_id: string;
  title: string;
  version: string;
  description: string;
  category: string;
  thumbnail?: string;
  created_date?: string;
  last_updated?: string;
  author?: string;
}

export interface FieldDefinition {
  field_id: string;
  label: string;
  data_type: 'string' | 'number' | 'currency' | 'date' | 'percentage' | 'email' | 'phone';
  format?: string;
  position: {
    section: string;
    order: number;
    column?: number;
    row?: number;
  };
  visibility?: boolean | string; // boolean or conditional expression
  calculation?: string; // formula for computed fields
  defaultValue?: any;
  width?: string;
  required?: boolean;
  editable?: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    custom?: string;
  };
}

export interface SectionDefinition {
  section_id: string;
  title: string;
  order: number;
  layout_type: 'grid' | 'table' | 'flex' | 'stack';
  columns?: number;
  styling?: string;
  visible?: boolean;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export interface TemplateConfiguration {
  metadata: TemplateMetadata;
  sections: SectionDefinition[];
  fields: FieldDefinition[];
  styling: {
    primaryColor?: string;
    secondaryColor?: string;
    backgroundColor?: string;
    fontFamily?: string;
    borderColor?: string;
    headerBackground?: string;
    accentColor?: string;
  };
  layout?: {
    maxWidth?: string;
    padding?: string;
    margin?: string;
  };
  branding?: {
    logo?: string;
    companyColors?: string[];
    watermark?: string;
  };
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