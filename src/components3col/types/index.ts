// Core types
export interface TemplateRegistryItem {
  template_id: string;
  title: string;
  config_path: string;
  thumbnail: string;
  category: string;
  description: string;
}

export interface TemplateStyling {
  [key: string]: string;
}

// Template data format (flat key-value structure for templates)
export interface TemplateData {
  [key: string]: any;
}

// New types from your code
export type Earnings = { 
  description: string; 
  rate: string | number; 
  hours: string | number; 
  current: string | number; 
  ytd: string | number; 
};

export type Deductions = { 
  description: string; 
  current: string | number; 
  ytd: string | number; 
};

export type Taxes = { 
  description: string; 
  current: string | number; 
  ytd: string | number; 
};

// Company Info
export interface CompanyInfo {
  companyName: string;
  companyAddress1: string;
  companyAddress2: string;
  companyCity: string;
  companyState: string;
  companyZipCode: string;
  companyPhone: string;
  companyEmail: string;
  companyEIN: string;
}

// Employee Info
export interface EmployeeInfo {
  employeeFirstName: string;
  employeeMiddleInitial: string;
  employeeLastName: string;
  employeeAddress1: string;
  employeeAddress2: string;
  employeeCity: string;
  employeeState: string;
  employeeZipCode: string;
  employeePhone: string;
  employeeEmail: string;
  employeeSSN: string;
  employeeID: string;
  employeeMarriedStatus: string;
  employeeHireDate: Date;
}

// Income Details
export interface IncomeDetails {
  annualSalary: number;
  wageType: string;
  hourlyRate: number;
  hoursWorked: number;
  overtimeRate: number;
  overtimeHours: number;
  bonusAmount: number;
  deduction401k: number;
  medicalDeduction: number;
  dentalDeduction: number;
  visionDeduction: number;
  otherDeduction: number;
  periodStartDate: string;
  periodEndDate: string;
  periodPayDate: string;
  periodType: string;
}

// General Info
export interface GeneralInfo {
  employmentType: string;
  paymentMethod: string;
  paymentFrequency: string;
  payStubNumber: string;
  payStubCount: string;
  checkNumber: string;
  extraNotes: string;
}

// PayStubDetails (Redux store structure)
export interface PayStubDetails {
  companyInfo: CompanyInfo;
  employeeInfo: EmployeeInfo;
  incomeDetails: IncomeDetails;
  generalInfo: GeneralInfo;
}

// Base field interface with common properties including calculation
export interface BaseField {
  field_id: string;
  label: string;
  data_type: string;
  format?: string;
  visibility?: string;
  calculation?: string;
}

export interface StringField extends BaseField {
  data_type: 'string';
}

export interface NumberField extends BaseField {
  data_type: 'number';
}

export interface CurrencyField extends BaseField {
  data_type: 'currency';
}

export interface DateField extends BaseField {
  data_type: 'date';
}

export interface DateRangeField extends BaseField {
  data_type: 'date_range';
}

export interface ImageField extends BaseField {
  data_type: 'image';
  position?: string;
}

export interface ArrayField extends BaseField {
  data_type: 'array';
  array_type: 'earnings' | 'deductions' | 'taxes';
}

export type FieldDefinition = StringField | NumberField | CurrencyField | DateField | DateRangeField | ImageField | ArrayField;

// Column and section types
export interface ColumnDefinition {
  column_id: string;
  title?: string;
  fields: FieldDefinition[];
}

export interface SectionDefinition {
  columns: ColumnDefinition[];
}

// Template configuration
export interface TemplateConfig {
  template_id: string;
  title: string;
  version: string;
  description: string;
  layout_type: string;
  styling: TemplateStyling;
  header: SectionDefinition;
  body: SectionDefinition;
  summary: SectionDefinition;
}

export interface FullTemplate extends TemplateRegistryItem, TemplateConfig {}

// Component props
export interface TemplateProps {
  store: PayStubDetails;
  styling: TemplateStyling;
  canPrintStub?: boolean;
}

export interface ColumnProps extends TemplateProps {
  fields: FieldDefinition[];
  title?: string;
}

export interface FieldProps {
  field: FieldDefinition;
  store: PayStubDetails;
  styling: TemplateStyling;
}