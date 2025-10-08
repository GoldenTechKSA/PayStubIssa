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

  return (
    <div
      className="bg-white shadow-lg rounded-lg overflow-hidden max-w-4xl mx-auto border-2"
      style={{
        fontFamily: config.styling.fontFamily,
        backgroundColor: config.styling.backgroundColor,
        borderColor: config.styling.borderColor || '#e5e7eb',
        maxWidth: config.layout?.maxWidth || '800px',
        padding: config.layout?.padding || '24px',
        margin: config.layout?.margin || 'auto'
      }}
    >
      <div className="space-y-4">
        <div
          className="text-center text-2xl font-bold mb-6"
          style={{ color: config.styling.primaryColor }}
        >
          {config.metadata.title}
        </div>
        {config.sections
          .sort((a, b) => a.order - b.order)
          .map((section) => (
            <div key={section.section_id} className="mb-4">
              {renderSection(section)}
            </div>
          ))}
      </div>
    </div>
  );
};

export default TemplateRenderer;