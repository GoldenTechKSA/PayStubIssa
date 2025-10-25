/**
 * Template Renderer Component
 * Dynamically renders paystub templates based on their JSON configuration and maps the redux store data to the template fields.
 * Supports various layout types (table, grid, flex, stack) and includes print-specific styles for accurate printing.
 * Handles computed fields using the calculation engine and formats field values based on their data types.
 * 
 * Features: Renders sections and fields as per the template configuration
 * Applies custom styling and layout options from the template configuration
 * Ensures print-ready formatting with CSS media queries
 */

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

  // console.log("TemplateRenderer: config", config);
  // console.log("TemplateRenderer: externalData", externalData);
  console.log("TemplateRenderer: templateData", templateData);  

  useEffect(() => {
    const initializeData = () => {
      const initialData: Record<string, any> = {};
      config.fields.forEach((field) => {
        initialData[field.field_id] = (externalData && field.source) ? templateData[field.source] : field.defaultValue;
      });

      // Calculate computed fields
      const calculatedData = calculationEngine.calculateDependentFields(config.fields, initialData);
      setFieldData(calculatedData);
    };

    initializeData();
  }, [config, externalData]);

  const renderField = (field: FieldDefinition) => {
    if (field.data_type === 'image') {
      const imageUrl = fieldData[field.source];
      return imageUrl ? <img className="object-fit-contain max-height-48px max-width-48px" src={imageUrl} alt="Company Logo" /> : null;
    }
    const value = fieldData[field.field_id];
    const formattedValue = fieldFormatter.format(value, field);
    return <span className="">{formattedValue}</span>;
  };

  const renderTableSection = (section: SectionDefinition) => {
    // all fields for this section, sorted globally by order then column then field_id
    const sectionFields = config.fields
      .filter((f) => f.position && f.position.section === section.section_id)
      .sort((a, b) => {
        const ao = a.position?.order ?? 0;
        const bo = b.position?.order ?? 0;
        const ac = a.position?.column ?? 1;
        const bc = b.position?.column ?? 1;
        if (ao !== bo) return ao - bo;
        if (ac !== bc) return ac - bc;
        return (a.field_id || '').localeCompare(b.field_id || '');
      });

    const columns = Math.max(1, section.columns || 1);

    // Build per-column map: columnIndex -> Map<rowOrder, FieldDefinition[]>
    const columnsMap: Array<Map<number, FieldDefinition[]>> = Array.from(
      { length: columns },
      () => new Map<number, FieldDefinition[]>()
    );

    sectionFields.forEach((field) => {
      const col = Math.min(Math.max(1, field.position?.column ?? 1), columns) - 1;
      const row = field.position?.order ?? 1;
      const m = columnsMap[col];
      if (!m.has(row)) m.set(row, []);
      m.get(row)!.push(field);
    });

    // For layout: compute col class
    const colClass = (12 % columns === 0) ? `col-md-${12 / columns}` : 'col';

    return (
      <div className={`${section.styling || ''} mb-3`}>
        {section.title && (
          <div className="py-2 bg-light border-bottom fw-semibold small px-3">
            {section.title}
          </div>
        )}

        <div className="row g-3 p-3">
          {columnsMap.map((rowMap, colIdx) => {
            // get sorted row orders for this column
            const rowOrders = Array.from(rowMap.keys()).sort((a, b) => a - b);

            return (
              <div key={colIdx} className={colClass}>
                <table className="table table-borderless mb-0">
                  <tbody>
                    {rowOrders.map((order) => {
                      const fieldsInRow = rowMap.get(order) || [];
                      return (
                        <tr key={order}>
                          {fieldsInRow.map((field) => (
                            <td key={field.field_id} style={{ verticalAlign: 'top' }}>
                              <div className="small text-muted">{field.label}</div>
                              <div className="fw-semibold">{renderField(field)}</div>
                            </td>
                          ))}
                        </tr>
                      );
                    })}

                    {/* if this column has no rows, render an empty placeholder */}
                    {rowOrders.length === 0 && (
                      <tr>
                        <td className="text-muted small">No fields</td>
                      </tr>
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
    //filter out fields for this section and sort by order
    const sectionFields = config.fields.filter((f) => f.position.section === section.section_id).sort((a, b) => a.position.order - b.position.order);
    const columns = section.columns || 1;

    // Group fields by column
    const columnFields: FieldDefinition[][] = Array.from({ length: columns }, () => []);
    sectionFields.forEach(field => {
      const colIndex = (field.position.column || 1) - 1;
      if (colIndex >= 0 && colIndex < columns) {
        columnFields[colIndex].push(field);
      }
    });

    return (
      <div className={`${section.styling || ''}`}>
        {section.title && (<h6 className="">{section.title}</h6>)}
        <div className="row">
          {columnFields.map((fields, colIndex) => (
            <div key={colIndex} className={`col-md-${12 / columns}`}>
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
    const sectionFields = config.fields
      .filter((f) => f.position.section === section.section_id)
      .sort((a, b) => a.position.order - b.position.order);

    return (
      <div className={`p-3 ${section.styling || ''}`}>
        {section.title && <h6 className="fw-semibold mb-2">{section.title}</h6>}
        <div className="d-flex flex-wrap gap-4">
          {sectionFields.map((field) => (
            <div key={field.field_id} className="flex-grow-1">
              <div className="small text-muted">{field.label}</div>
              <div className="fw-semibold">{renderField(field)}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderStackSection = (section: SectionDefinition) => {
    const sectionFields = config.fields
      .filter((f) => f.position.section === section.section_id)
      .sort((a, b) => a.position.order - b.position.order);

    return (
      <div className={`p-3 ${section.styling || ''}`}>
        {section.title && <h6 className="fw-semibold mb-2">{section.title}</h6>}
        <div className="d-flex flex-column gap-3">
          {sectionFields.map((field) => (
            <div key={field.field_id} className="d-flex justify-content-between align-items-center">
              <span className="small text-muted">{field.label}</span>
              <span className="fw-semibold">{renderField(field)}</span>
            </div>
          ))}
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
      case 'stack':
        return renderStackSection(section);
      default:
        return renderFlexSection(section);
    }
  };

  // Check if sections should be rendered in 3-column layout
  const isThreeColumnLayout = () => {
    const columnSections = config.sections.filter(s => 
      s.section_id.includes('column') || 
      (s.section_id === 'left_column' || s.section_id === 'middle_column' || s.section_id === 'right_column')
    );
    return columnSections.length === 3;
  };

  const renderThreeColumnLayout = () => {
    const leftColumn = config.sections.find(s => s.section_id === 'left_column');
    const middleColumn = config.sections.find(s => s.section_id === 'middle_column');
    const rightColumn = config.sections.find(s => s.section_id === 'right_column');

    return (
      <div className="row">
        {leftColumn && (
          <div className="col-md-4">
            {renderSection(leftColumn)}
          </div>
        )}
        {middleColumn && (
          <div className="col-md-4">
            {renderSection(middleColumn)}
          </div>
        )}
        {rightColumn && (
          <div className="col-md-4">
            {renderSection(rightColumn)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className=""
      // style={{
      //   fontFamily: config.styling.fontFamily,
      //   backgroundColor: config.styling.backgroundColor,
      //   borderColor: config.styling.borderColor || '#00458aff',
      //   maxWidth: config.layout?.maxWidth || '8.5in',
      //   minHeight: '11in',
      //   border: '1px solid #d80000ff'
      // }}
    >
      <div className="">
        {config.sections.sort((a, b) => a.order - b.order).map((section) => {
            // Skip column sections if we're rendering them in 3-column layout
            if (isThreeColumnLayout() && (section.section_id === 'left_column' || section.section_id === 'middle_column' || section.section_id === 'right_column')) {
              // Only render the three-column layout once when we hit the first column
              if (section.section_id === 'left_column') {
                return (<div key="three-column-layout" className="">{renderThreeColumnLayout()}</div>);
              }
              return null;
            }
          
            return (<div key={section.section_id} className="">{renderSection(section)}</div>);
          })}
      </div>
    </div>
  );
};

export default TemplateRenderer;