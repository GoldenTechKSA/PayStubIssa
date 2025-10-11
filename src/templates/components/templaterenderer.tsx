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
          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      );
    }

    return <span>{formattedValue}</span>;
  };

  const renderTableSection = (section: SectionDefinition) => {
    const sectionFields = config.fields
      .filter((f) => f.position.section === section.section_id)
      .sort((a, b) => a.position.order - b.position.order);

    return (
      <div className={`overflow-hidden rounded-lg ${section.styling || ''}`}>
        <div className="px-4 py-3 bg-gray-100 font-semibold text-sm border-b">
          {section.title}
        </div>
        <div className="divide-y">
          {sectionFields.map((field) => (
            <div key={field.field_id} className="flex justify-between px-4 py-2 hover:bg-gray-50">
              <span className="text-gray-700">{field.label}</span>
              <span className="font-medium">{renderField(field, editable)}</span>
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

    return (
      <div className={`p-4 rounded ${section.styling || ''}`}>
        {section.title && <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide opacity-75">{section.title}</h3>}
        <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {sectionFields.map((field) => (
            <div key={field.field_id} className="space-y-1">
              <div className="text-xs font-medium opacity-75">{field.label}</div>
              <div className="text-lg font-semibold">{renderField(field, editable)}</div>
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
      <div className={`p-4 ${section.styling || ''}`}>
        {section.title && <h3 className="font-semibold mb-2">{section.title}</h3>}
        <div className="flex flex-wrap gap-6">
          {sectionFields.map((field) => (
            <div key={field.field_id} className="space-y-1">
              <div className="text-sm text-gray-600">{field.label}</div>
              <div className="font-medium">{renderField(field, editable)}</div>
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
      <div className={`p-4 space-y-3 ${section.styling || ''}`}>
        {section.title && <h3 className="font-semibold mb-2">{section.title}</h3>}
        {sectionFields.map((field) => (
          <div key={field.field_id} className="flex justify-between items-center">
            <span className="text-sm text-gray-700">{field.label}</span>
            <span className="font-semibold">{renderField(field, editable)}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderSection = (section: SectionDefinition) => {
    if (!section.visible && section.visible !== undefined) {
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {leftColumn && (
          <div className="space-y-2">
            {renderSection(leftColumn)}
          </div>
        )}
        {middleColumn && (
          <div className="space-y-2">
            {renderSection(middleColumn)}
          </div>
        )}
        {rightColumn && (
          <div className="space-y-2">
            {renderSection(rightColumn)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="bg-white rounded-lg overflow-hidden mx-auto print-paystub"
      style={{
        fontFamily: config.styling.fontFamily,
        backgroundColor: config.styling.backgroundColor,
        borderColor: config.styling.borderColor || '#e5e7eb',
        maxWidth: config.layout?.maxWidth || '8.5in',
        minHeight: '11in',
        padding: '0.5in',
        margin: config.layout?.margin || 'auto',
        border: '1px solid #d1d5db'
      }}
    >
      <div className="space-y-6">
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
                  <div key="three-column-layout" className="mb-6">
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
          
          .print-title {
            font-size: 16pt !important;
            margin-bottom: 16pt !important;
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
          
          /* Ensure grid borders print */
          .border {
            border: 1px solid #000 !important;
          }
          
          /* Ensure all 3-column grids maintain structure */
          .grid {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 0.25in !important;
          }
          
          /* Make sure background colors print */
          .bg-blue-50,
          .bg-blue-100,
          .bg-gray-50,
          .bg-gray-100 {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Font sizes for print */
          body {
            font-size: 9pt;
          }
          
          h3 {
            font-size: 10pt !important;
            margin-bottom: 8pt !important;
          }
          
          /* Field labels */
          .text-xs {
            font-size: 7pt !important;
          }
          
          /* Field values */
          .text-sm {
            font-size: 9pt !important;
          }
          
          /* Ensure proper spacing */
          .space-y-6 > * + * {
            margin-top: 16pt !important;
          }
          
          .space-y-3 > * + * {
            margin-top: 8pt !important;
          }
          
          .space-y-1 > * + * {
            margin-top: 4pt !important;
          }
          
          /* Column spacing */
          .gap-6 {
            gap: 0.25in !important;
          }
          
          /* Avoid page breaks inside sections */
          .border, .section-wrapper {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
};

export default TemplateRenderer;