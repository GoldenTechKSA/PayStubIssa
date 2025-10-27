// Template Renderer Component
// Dynamically renders paystub templates based on their JSON configuration and maps the redux store data to the template fields.
// Supports various layout types (table, grid, flex, stack) and includes print-specific styles for accurate printing.
// Handles computed fields using the calculation engine and formats field values based on their data types.
import React, { useEffect, useState } from 'react';
import { TemplateConfiguration, SectionDefinition, FieldDefinition } from '../types/templatetypes';
import { calculationEngine } from '../utils/calculationengine';
import { fieldFormatter } from '../utils/fieldformatter';
import { mapStoreToTemplateData } from '../../utils/datamapper';
import { PayStubDetails } from 'components3col/types';

interface TemplateRendererProps {
  config: TemplateConfiguration;
  data?: Record<string, any>;
  onChange?: (data: Record<string, any>) => void;
}

export const TemplateRenderer: React.FC<TemplateRendererProps> = ({ config, data: externalData, onChange }) => {
  const [fieldData, setFieldData] = useState<Record<string, any>>({});
  const templateData = mapStoreToTemplateData(externalData as PayStubDetails);

  const getByPath = (obj: any, path?: string) => {
    if (obj == null || !path) return undefined;
    if (Object.prototype.hasOwnProperty.call(obj, path)) return obj[path];
    return path.split('.').reduce((acc: any, part: string) => acc && acc[part], obj);
  };

  // Strict: sections must have columns array and fields live under columns[].fields
  const getFieldsForSection = (section: SectionDefinition): FieldDefinition[] => {
    const cols = (section as any).columns as Array<any> | undefined;
    if (!Array.isArray(cols)) return [];
    return cols.flatMap((c) => Array.isArray(c.fields) ? c.fields as FieldDefinition[] : []);
  };

  const getAllFields = (): FieldDefinition[] => {
    if (!Array.isArray(config.sections)) return [];
    return config.sections.flatMap((s: any) => {
      const cols = Array.isArray(s.columns) ? s.columns : [];
      return cols.flatMap((c: any) => Array.isArray(c.fields) ? c.fields : []);
    }) as FieldDefinition[];
  };

  useEffect(() => {
    const initializeData = () => {
      const initialData: Record<string, any> = {};
      const allFields = getAllFields();

      allFields.forEach((field) => {
        let value: any = undefined;
        if (field.source) {
          value = getByPath(templateData, field.source);
          if (value === undefined) value = getByPath(externalData, field.source);
          if (value === undefined) value = templateData ? (templateData as any)[field.source] : undefined;
        }
        initialData[field.field_id] = value !== undefined ? value : field.defaultValue;
      });

      const calculatedData = calculationEngine.calculateDependentFields(allFields, initialData);
      setFieldData(calculatedData);
      if (onChange) onChange(calculatedData);
    };

    initializeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, externalData]);

  const renderField = (field: FieldDefinition) => {
    if (field.data_type === 'image') {
      const imageUrl = fieldData[field.field_id];
      return imageUrl ? <img className="object-fit-contain" style={{ maxHeight: 148, maxWidth: 148 }} src={imageUrl} alt={field.label || 'image'} /> : null;
    }
    const value = fieldData[field.field_id];
    const formattedValue = fieldFormatter.format(value, field);
    return <span>{formattedValue}</span>;
  };

  // Helper: safely parse order values which may be number | string | undefined
  const parseOrder = (raw: any): number | undefined => {
    if (raw === null || raw === undefined) return undefined;
    if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
    if (typeof raw === 'string') {
      const n = parseInt(raw.trim(), 10);
      return Number.isFinite(n) ? n : undefined;
    }
    return undefined;
  };

  const getFieldOrder = (field: FieldDefinition, defaultVal = 0): number => {
    const raw = (field as any)?.position?.order;
    const parsed = parseOrder(raw);
    return parsed !== undefined ? parsed : defaultVal;
  };

  // New helper: compute className and inline style for a column based on ColumnDefinition.width
  const getColumnProps = (colDef: any, totalColumns: number) => {
    const result: { className?: string; style?: React.CSSProperties } = {};
    const rawWidth = colDef?.width;

    if (rawWidth !== undefined && rawWidth !== null) {
      const w = String(rawWidth).trim();

      // numeric bootstrap column (1-12)
      if (/^[1-9]$|^1[0-2]$/.test(w)) {
        result.className = `col-md-${w}`;
        return result;
      }

      // percentage or px or other CSS units -> use inline width and let bootstrap .col handle flex
      if (/^\d+%$/.test(w) || /^\d+px$/.test(w) || /rem|em|vw|vh|fr/.test(w)) {
        result.className = 'col';
        result.style = { width: w };
        return result;
      }

      // fractional e.g. "1fr" or "0.3" -> use flex-basis if numeric fraction provided as decimal
      if (/^[0-9]*\.?[0-9]+$/.test(w)) {
        // interpret as fraction of available columns
        const fraction = parseFloat(w);
        if (fraction > 0) {
          result.className = 'col';
          result.style = { flex: `${fraction} 1 auto` };
          return result;
        }
      }

      // fallback: treat as CSS width
      result.className = 'col';
      result.style = { width: w };
      return result;
    }

    // fallback: equal distribution using bootstrap columns when divisible, else 'col'
    if (totalColumns > 0 && 12 % totalColumns === 0) {
      result.className = `col-md-${12 / totalColumns}`;
    } else {
      result.className = 'col';
    }
    return result;
  };

  const renderTableSection = (section: SectionDefinition) => {
    const cols = (section as any).columns as Array<any> | undefined;
    if (!Array.isArray(cols) || cols.length === 0) {
      return (
        <div className={`${section.styling || ''} mb-3`}>
          {section.title && (<div className="py-2 bg-light border-bottom fw-semibold small px-3">{section.title}</div>)}
          <div className="p-3 text-muted small">Invalid section schema: expected columns array with fields</div>
        </div>
      );
    }

    const columns = cols.length;

    return (
      <div className={`${section.styling || ''} `}>
        {section.title && (<div className="py-2 bg-light border-bottom fw-semibold small">{section.title}</div>)}
        <div className="row">
          {cols.map((colDef, colIdx) => {
            const colProps = getColumnProps(colDef, columns);
            const fieldsForCol: FieldDefinition[] = Array.isArray(colDef.fields) ? (colDef.fields as FieldDefinition[]).slice() : [];
            // use getFieldOrder to obtain numeric order safely
            fieldsForCol.sort((a, b) => getFieldOrder(a, 0) - getFieldOrder(b, 0));

            const rowMap = new Map<number, FieldDefinition[]>();
            fieldsForCol.forEach(field => {
              // row fallback to 1 when order missing or invalid
              const row = Math.max(1, Math.floor(getFieldOrder(field, 1)));
              if (!rowMap.has(row)) rowMap.set(row, []);
              rowMap.get(row)!.push(field);
            });
            const rowOrders = Array.from(rowMap.keys()).sort((a, b) => a - b);

            return (
              <div key={colIdx} className={colProps.className} style={colProps.style}>
                <table role="table" className="">
                  <tbody>
                    {rowOrders.map(order => {
                      const fieldsInRow = rowMap.get(order) || [];
                      return (
                        <tr key={order}>
                          {fieldsInRow.flatMap(field => {
                            const labelClass = `small text-muted ${field.styling || ''}`;
                            const valueClass = `fw-semibold ${field.styling || ''} text-end`;
                            return [
                              <td key={`${field.field_id}-label`} className={labelClass} style={{ whiteSpace: 'nowrap' }}>{field.label ?? ''}</td>,
                              <td key={`${field.field_id}-value`} className={valueClass} style={{ verticalAlign: 'top' }}>{renderField(field)}</td>
                            ];
                          })}
                        </tr>
                      );
                    })}

                    {rowOrders.length === 0 && (
                      <tr><td colSpan={2} className="text-muted small">No fields</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderGridSection = (section: SectionDefinition) => {
    const cols = (section as any).columns as Array<any> | undefined;
    if (!Array.isArray(cols) || cols.length === 0) return null;

    const columns = cols.length;

    return (
      <div className={`${section.styling || ''}`}>
        {section.title && (<h6 className="">{section.title}</h6>)}
        <div className="row">
          {cols.map((col, colIndex) => {
            const colProps = getColumnProps(col, columns);
            return (
              <div key={colIndex} className={colProps.className} style={colProps.style}>
                {(Array.isArray(col.fields) ? col.fields : []).map((field: FieldDefinition) => (
                  <div key={field.field_id} className="">
                    {field.label && (<span className={`${field.styling || ''}`}>{field.label}: </span>)}
                    <span className={`${field.styling || ''}`}>{renderField(field)}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderFlexSection = (section: SectionDefinition) => {
    const cols = (section as any).columns as Array<any> | undefined;
    if (!Array.isArray(cols) || cols.length === 0) return null;
    const columns = cols.length;

    return (
      <div className={`${section.styling || ''}`}>
        {section.title && <h6 className="fw-semibold mb-2">{section.title}</h6>}
        <div className="row"> {/* use row to respect column width config even for flex-like layout */}
          {cols.map((col, colIndex) => {
            const colProps = getColumnProps(col, columns);
            const sectionFields: FieldDefinition[] = Array.isArray(col.fields) ? col.fields.slice() : [];
            sectionFields.sort((a, b) => getFieldOrder(a, 0) - getFieldOrder(b, 0));

            return (
              <div key={colIndex} className={colProps.className} style={colProps.style}>
                <div className="d-flex flex-column gap-2">
                  {sectionFields.map((field) => (
                    <div key={field.field_id} className="d-flex flex-column" style={{ minWidth: 160 }}>
                      <span className={`small text-muted ${field.styling || ''}`}>{field.label}</span>
                      <span className={`fw-semibold ${field.styling || ''}`}>{renderField(field)}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderSection = (section: SectionDefinition) => {
    if (section.visible === false) return null;
    switch (section.layout_type) {
      case 'table':
        return renderTableSection(section);
      case 'grid':
        return renderGridSection(section);
      case 'flex':
        return renderFlexSection(section);
      default:
        return renderFlexSection(section);
    }
  };

  // Use a shallow copy of sections before sorting to avoid mutating props
  const sectionsToRender = Array.isArray(config.sections) ? [...config.sections] : [];

  return (
    <div>
      <div>
        {sectionsToRender.sort((a, b) => (Number(a?.order ?? 0) - Number(b?.order ?? 0))).map((section) => (
          <div key={section.section_id}>{renderSection(section)}</div>
        ))}
      </div>
    </div>
  );
};

export default TemplateRenderer;