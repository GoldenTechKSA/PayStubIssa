/**
 * Template Renderer Component
 * Dynamically renders paystub templates based on JSON configuration
 */

import React, { useEffect, useState } from 'react';
import { TemplateConfiguration, SectionDefinition, FieldDefinition } from '../types/templatetypes';
import { calculationEngine } from '../utils/calculationengine';
import { fieldFormatter } from '../utils/fieldformatter';

interface TemplateRendererProps {
  config: TemplateConfiguration;
  data?: Record<string, any>;
  editable?: boolean;
  onChange?: (data: Record<string, any>) => void;
}

export const TemplateRenderer: React.FC<TemplateRendererProps> = ({
  config,
  data: externalData,
  editable = false,
  onChange
}) => {
  const [fieldData, setFieldData] = useState<Record<string, any>>({});

  useEffect(() => {
    initializeData();
  }, [config, externalData]);

  const initializeData = () => {
    const initialData: Record<string, any> = {};
    
    // Use external data if provided, otherwise use default values
    config.fields.forEach((field) => {
      if (externalData && externalData[field.field_id] !== undefined) {
        initialData[field.field_id] = externalData[field.field_id];
      } else {
        initialData[field.field_id] = field.defaultValue;
      }
    });

    // Calculate computed fields
    const calculatedData = calculationEngine.calculateDependentFields(config.fields, initialData);
    setFieldData(calculatedData);
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    const updatedData = { ...fieldData, [fieldId]: value };
    const calculatedData = calculationEngine.calculateDependentFields(config.fields, updatedData);
    setFieldData(calculatedData);
    
    if (onChange) {
      onChange(calculatedData);
    }
  };

  const renderField = (field: FieldDefinition, isEditable: boolean) => {
    const value = fieldData[field.field_id];
    const formattedValue = fieldFormatter.format(value, field);

    if (isEditable && field.editable !== false && !field.calculation) {
      return (
        <input
          type={field.data_type === 'number' || field.data_type === 'currency' ? 'number' : 'text'}
          value={value || ''}
          onChange={(e) => handleFieldChange(field.field_id, e.target.value)}
          className="form-control form-control-sm"
        />
      );
    }

    return <span className="field-value">{formattedValue}</span>;
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
              <span className="fw-semibold">{renderField(field, editable)}</span>
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
                  <div className="field-label">{field.label}</div>
                  <div>{renderField(field, editable)}</div>
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
              <div className="fw-semibold">{renderField(field, editable)}</div>
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
              <span className="fw-semibold">{renderField(field, editable)}</span>
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
      className="print-paystub bg-white"
      style={{
        fontFamily: config.styling.fontFamily,
        backgroundColor: config.styling.backgroundColor,
        borderColor: config.styling.borderColor || '#dee2e6',
        maxWidth: config.layout?.maxWidth || '8.5in',
        minHeight: '11in',
        padding: '2rem',
        margin: config.layout?.margin || 'auto',
        border: '1px solid #dee2e6'
      }}
    >
      <div className="d-flex flex-column gap-4">
        {config.sections
          .sort((a, b) => a.order - b.order)
          .map((section) => {
            // Skip column sections if we're rendering them in 3-column layout
            if (isThreeColumnLayout() && 
                (section.section_id === 'left_column' || 
                 section.section_id === 'middle_column' || 
                 section.section_id === 'right_column')) {
              // Only render the three-column layout once when we hit the first column
              if (section.section_id === 'left_column') {
                return (
                  <div key="three-column-layout" className="mb-4">
                    {renderThreeColumnLayout()}
                  </div>
                );
              }
              return null;
            }
            
            return (
              <div key={section.section_id} className="section-wrapper">
                {renderSection(section)}
              </div>
            );
          })}
      </div>

      {/* Print-specific styles for the paystub */}
      <style>{`
        @media print {
          .print-paystub {
            box-shadow: none !important;
            border: 1px solid #000 !important;
            border-radius: 0 !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0.5in !important;
            min-height: 0 !important;
          }
          
          /* Section spacing */
          .section-wrapper {
            margin-bottom: 16pt !important;
            page-break-inside: avoid;
          }
          
          /* Ensure table borders print */
          table, th, td {
            border: 1px solid #000 !important;
          }
          
          /* Ensure Bootstrap grid maintains structure */
          .row {
            display: flex !important;
            flex-wrap: nowrap !important;
            margin: 0 !important;
          }
          
          .col, .col-md-4 {
            flex: 1 !important;
            padding: 0 0.25in !important;
          }
          
          /* Make sure background colors print */
          .bg-blue-50,
          .bg-blue-100,
          .bg-gray-50,
          .bg-light {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Font sizes for print */
          body {
            font-size: 9pt;
          }
          
          h6, .h6 {
            font-size: 10pt !important;
            margin-bottom: 8pt !important;
          }
          
          /* Field labels */
          .field-label {
            font-size: 7pt !important;
          }
          
          /* Field values */
          .field-value {
            font-size: 9pt !important;
          }
          
          /* Column spacing */
          .column-field {
            margin-bottom: 8pt !important;
          }
          
          /* Avoid page breaks inside sections */
          .border, .section-wrapper, .card {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
};

export default TemplateRenderer;