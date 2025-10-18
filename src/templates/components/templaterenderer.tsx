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

interface TemplateRendererProps {
  config: TemplateConfiguration;
  data?: Record<string, any>;
  onChange?: (data: Record<string, any>) => void;
}

export const TemplateRenderer: React.FC<TemplateRendererProps> = ({config, data: externalData, onChange}) => {
  const [fieldData, setFieldData] = useState<Record<string, any>>({});

  console.log("TemplateRenderer: config", config);
  console.log("TemplateRenderer: externalData", externalData);  


  useEffect(() => {
    const initializeData = () => {
      const initialData: Record<string, any> = {};
      
      function getByPath(obj: any, path: string) {
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
      }

      config.fields.forEach((field) => {
        let value = undefined;
        if (externalData && field.source) {
          value = getByPath(externalData, field.source);
        }
        if (value !== undefined) {
          initialData[field.field_id] = value;
        } else {
          initialData[field.field_id] = field.defaultValue;
        }
      });

      // Calculate computed fields
      const calculatedData = calculationEngine.calculateDependentFields(config.fields, initialData);
      setFieldData(calculatedData);
    };

    initializeData();
  }, [config, externalData]);

  const renderField = (field: FieldDefinition) => {
    const value = fieldData[field.field_id];
    const formattedValue = fieldFormatter.format(value, field);
    return <span className="">{formattedValue}</span>;
  };

  const renderTableSection = (section: SectionDefinition) => {
    const sectionFields = config.fields
      .filter((f) => f.position.section === section.section_id)
      .sort((a, b) => a.position.order - b.position.order);

    return (
      <div className={`border rounded ${section.styling || ''}`}>
        <div className="p-3 bg-light border-bottom fw-semibold small">
          {section.title}
        </div>
        <div className="list-group list-group-flush">
          {sectionFields.map((field) => (
            <div key={field.field_id} className="list-group-item d-flex justify-content-between align-items-center py-2">
              <span className="text-muted">{field.label}</span>
              <span className="fw-semibold">{renderField(field)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderGridSection = (section: SectionDefinition) => {
    const sectionFields = config.fields
      .filter((f) => f.position.section === section.section_id)
      .sort((a, b) => a.position.order - b.position.order);

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
      <div className={`p-3 rounded ${section.styling || ''}`}>
        {section.title && (
          <h6 className="section-header mb-3">{section.title}</h6>
        )}
        <div className="row">
          {columnFields.map((fields, colIndex) => (
            <div key={colIndex} className={`col-md-${12 / columns} column-wrapper`}>
              {fields.map((field) => (
                <div key={field.field_id} className="column-field">
                  <span className="field-label">{field.label}</span>
                  <span>{renderField(field)}</span>
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
      <div className="row g-3">
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
                return (<div key="three-column-layout" className="mb-4">{renderThreeColumnLayout()}</div>);
              }
              return null;
            }
          
            return (<div key={section.section_id} className="section-wrapper">{renderSection(section)}</div>);
          })}
      </div>
    </div>
  );
};

export default TemplateRenderer;