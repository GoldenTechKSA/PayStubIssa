import React from 'react';
import { FullTemplate } from './types';

interface TemplateSelectorProps {
  templates: FullTemplate[];
  onSelect: (template: FullTemplate) => void;
  selectedTemplateId: string | null;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ 
  templates, 
  onSelect, 
  selectedTemplateId 
}) => {
  return (
    <div className="template-selector">
      <h2 className="text-lg font-bold mb-4">Select a Paystub Template</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {templates.map(template => (
          <div 
            key={template.template_id}
            className={`border rounded-lg p-4 cursor-pointer transition-all ${
              selectedTemplateId === template.template_id 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-blue-300'
            }`}
            onClick={() => onSelect(template)}
          >
            <div className="flex justify-center mb-3">
              <img 
                src={template.thumbnail} 
                alt={template.title} 
                className="w-full h-32 object-cover rounded"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/images/default-template-thumb.png';
                }}
              />
            </div>
            <h3 className="font-bold">{template.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{template.description}</p>
            <div className="mt-2">
              <span className="inline-block px-2 py-1 text-xs bg-gray-200 rounded">
                {template.category}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TemplateSelector;