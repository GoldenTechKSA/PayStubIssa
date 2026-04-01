export interface StyleConfig {
  backgroundColor?: string;
  color?: string;
  fontSize?: string;
  fontWeight?: string;
  padding?: string;
  margin?: string;
  marginTop?: string;
  marginBottom?: string;
  border?: string;
  borderRadius?: string;
  textAlign?: 'left' | 'center' | 'right';
  width?: string;
  fontFamily?: string;
  boxShadow?: string;
  [key: string]: string | undefined;
}
export interface TableCellConfig {
  id: string;
  colspan?: number;
  value?: string;
  type: 'static' | 'calculated' | 'substitute';
  formula?: string; // Formula for calculated values, e.g., "{payment.grossPay}"
  style?: StyleConfig;
}
export interface TableHeaderDataConfig {
  id: string;
  colspan?: number;
  label: string;
  style?: StyleConfig;
}
export interface TableHeaderConfig {
  title?: string;
  style?: StyleConfig;
  hdata?: TableHeaderDataConfig[];
}
export interface TableConfig {
  id: string;
  header?: TableHeaderConfig;
  cells: TableCellConfig[][];
  style?: StyleConfig;
}
export interface ColumnConfig {
  id: string;
  width: string; // e.g., "25%", "50%", "100%"
  tables: TableConfig[];
  style?: StyleConfig;
}
export interface SectionConfig {
  id: string;
  columns: ColumnConfig[]; // Up to 4 columns per section
  style?: StyleConfig;
}
export interface PaystubConfig {
  sections: SectionConfig[];
  globalStyle?: StyleConfig;
}

// ================================================================= DATA MODELS ================================================================
export interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  email?: string;
  logo?: string;
}
export interface EmployeeInfo {
  name: string;
  id: string;
  department: string;
  position?: string;
  hireDate?: string;
}
export interface PaymentInfo {
  grossPay: number;
  netPay: number;
  federalTax: number;
  stateTax: number;
  socialSecurity: number;
  medicare: number;
  deductions: number;
  regularHours?: number;
  overtimeHours?: number;
  hourlyRate?: number;
}
export interface PayPeriodInfo {
  start: string;
  end: string;
  payDate: string;
}
export interface PaystubData {
  company: CompanyInfo;
  employee: EmployeeInfo;
  payment: PaymentInfo;
  payPeriod: PayPeriodInfo;
}