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
  float?: 'left' | 'none' | 'right';
  [key: string]: string | undefined;
}
export type CellFormat = 'currency' | 'number' | 'date' | 'text';

export interface TableCellConfig {
  id: string;
  colspan?: number;
  value?: string;
  type: 'static' | 'calculated' | 'substitute';
  formula?: string; // Formula for calculated values, e.g., "{payment.grossPay}"
  // Presentation applied to the resolved value by the renderer.
  // 'currency' -> $1,234.56, 'number' -> 1,234.56, 'date' -> MM/DD/YYYY, 'text'/undefined -> raw.
  // 'calculated' cells default to 'currency' when format is omitted (back-compat).
  format?: CellFormat;
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
