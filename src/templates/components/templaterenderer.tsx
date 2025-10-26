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

export const TemplateRenderer: React.FC<TemplateRendererProps> = ({config, data: externalData, onChange}) => {
  const [fieldData, setFieldData] = useState<Record<string, any>>({});
  const templateData = mapStoreToTemplateData(externalData as PayStubDetails);

  // Helper: safe dot-path getter (supports direct keys and nested "a.b.c")
  const getByPath = (obj: any, path?: string) => {
    if (obj == null || !path) return undefined;
    if (Object.prototype.hasOwnProperty.call(obj, path)) return obj[path];
    return path.split('.').reduce((acc: any, part: string) => acc && acc[part], obj);
  };

  // helper: prefer section.fields, fallback to legacy top-level config.fields
  const getFieldsForSection = (section: SectionDefinition) : FieldDefinition[] => {
    if (Array.isArray((section as any).fields) && (section as any).fields.length > 0) {
      return (section as any).fields as FieldDefinition[];
    }
    if (Array.isArray((config as any).fields)) {
      return (config as any).fields.filter((f: FieldDefinition) => f.position?.section === section.section_id);
    }
    return [];
  };

  // helper: all fields across sections (for initializeData)
  const getAllFields = (): FieldDefinition[] => {
    // if top-level fields exist, use them
    if (Array.isArray((config as any).fields) && (config as any).fields.length > 0) {
      return (config as any).fields as FieldDefinition[];
    }
    // otherwise flatten section.fields
    return config.sections.flatMap((s: any) => Array.isArray(s.fields) ? s.fields as FieldDefinition[] : []);
  };

  // use getAllFields in initializeData instead of config.fields
  useEffect(() => {
    const initializeData = () => {
      const initialData: Record<string, any> = {};
      const allFields = getAllFields();

      allFields.forEach((field) => {
        let value: any = undefined;
        if (field.source) {
          // existing source resolution (keep your implementation)
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
      // image source is stored on the field_id after initializeData
      const imageUrl = fieldData[field.field_id];
      return imageUrl ? <img className="object-fit-contain" style={{ maxHeight: 148, maxWidth: 148 }} src={imageUrl} alt={field.label || 'image'} /> : null;
    }
    const value = fieldData[field.field_id];
    const formattedValue = fieldFormatter.format(value, field);
    return <span className="">{formattedValue}</span>;
  };

  // Render a section as a single row containing N Bootstrap columns.
  // in the future we could have each column may have its own layout_type (if section.columns is an array of column defs),
  // otherwise all columns inherit section.layout_type.
  // ...existing code...
  const renderTableSection = (section: SectionDefinition) => {
    // get fields for this section (no global pre-sort)
    const allSectionFields = getFieldsForSection(section) || [];

    // Determine columns: prefer section.columns, but ensure we cover any column numbers declared on fields
    const sectionCols = Math.max(1, Number((section.columns as number) || 1) || 1);
    const maxColInFields = allSectionFields.length
      ? Math.max(...allSectionFields.map(f => {
          const c = Number(f.position?.column ?? 1);
          return Number.isFinite(c) && c >= 1 ? c : 1;
        }))
      : 1;
    const columns = Math.max(sectionCols, maxColInFields);
    const colClass = (12 % columns === 0) ? `col-md-${12 / columns}` : 'col';

    return (
      <div className={`${section.styling || ''}`}>
        {section.title && (<div className="py-2 border-bottom fw-semibold small">{section.title}</div>)}
        <div className="row">
          {Array.from({ length: columns }).map((_, colIdx) => {
            // filter and sort fields for THIS column only (coerce column value to number)
            const fieldsForCol = allSectionFields
              .filter(f => {
                const fCol = Number(f.position?.column ?? 1);
                const idx = Number.isFinite(fCol) ? Math.max(0, Math.floor(fCol) - 1) : 0;
                return idx === colIdx;
              })
              .slice()
              .sort((a, b) => (Number(a.position?.order ?? 0) - Number(b.position?.order ?? 0)));

            // build rowOrder -> fields map for this column
            const rowMap = new Map<number, FieldDefinition[]>();
            fieldsForCol.forEach(field => {
              const row = Number(field.position?.order ?? 1) || 1;
              if (!rowMap.has(row)) rowMap.set(row, []);
              rowMap.get(row)!.push(field);
            });

            const rowOrders = Array.from(rowMap.keys()).sort((a, b) => a - b);

            return (
              <div key={colIdx} className={colClass}>
                <table role="table" className="table table-borderless mb-0">
                  <tbody>
                    {rowOrders.map((order) => {
                      const fieldsInRow = rowMap.get(order) || [];
                      return (
                        <tr key={order}>
                          {fieldsInRow.flatMap((field) => {
                            const labelClass = `small text-muted ${field.styling || ''}`;
                            const valueClass = `fw-semibold ${field.styling || ''}`;
                            return [
                              <td key={`${field.field_id}-label`} className={labelClass} style={{ whiteSpace: 'nowrap' }}>{field.label ?? ''}</td>,
                              <td key={`${field.field_id}-value`} className={valueClass} style={{ verticalAlign: 'top' }}>{renderField(field)}</td>
                            ];
                          })}
                        </tr>
                      );
                    })}

                    {rowOrders.length === 0 && (<tr><td colSpan={2} className="text-muted small">No fields</td></tr>)}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  // ...existing code...

  const renderGridSection = (section: SectionDefinition) => {
    const sectionFields = getFieldsForSection(section).sort((a,b) => (a.position?.order||0) - (b.position?.order||0));
    const columns = (section as any).columns || 1;
    const columnFields: FieldDefinition[][] = Array.from({ length: columns }, () => []);
    sectionFields.forEach(field => {
      const colIndex = Math.max(0, (field.position?.column || 1) - 1);
      if (colIndex < columns) columnFields[colIndex].push(field);
    });

    return (
      <div className={`${section.styling || ''}`}>
        {section.title && (<h6 className="">{section.title}</h6>)}
        <div className="row">
          {columnFields.map((fields, colIndex) => (
            <div key={colIndex} className={`col-md-${Math.max(1, Math.floor(12 / columns))}`}>
              {fields.map((field) => (
                <div key={field.field_id} className="">
                  {field.label && (<span className={`${field.styling}`}>{field.label}: </span>)}
                  <span className={`${field.styling}`}>{renderField(field)}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderFlexSection = (section: SectionDefinition) => {
    // get fields from section (new schema) or fallback to top-level fields
    const sectionFields = getFieldsForSection(section).slice().sort((a, b) => (a.position?.order ?? 0) - (b.position?.order ?? 0));

    return (
      <div className={`${section.styling || ''}`}>
        {section.title && <h6 className="fw-semibold mb-2">{section.title}</h6>}
        <div className="d-flex flex-wrap gap-4">
          {sectionFields.map((field) => (
            <div key={field.field_id} className="d-flex flex-column" style={{ minWidth: 160 }}>
              <span className={`small text-muted ${field.styling || ''}`}>{field.label}</span>
              <span className={`fw-semibold ${field.styling || ''}`}>{renderField(field)}</span>
            </div>
          ))}
          {sectionFields.length === 0 && <div className="text-muted small">No fields</div>}
        </div>
      </div>
    );
  };

  const renderSection = (section: SectionDefinition) => {
    if (section.visible === false) {
      return null;
    }

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

  return (
    <div className="">
      <div className="">
        { config.sections.sort((a, b) => a.order - b.order).map((section) => {
            return (<div key={section.section_id} className="">{renderSection(section)}</div>);
        })}
      </div>
    </div>
  );
};

export default TemplateRenderer;