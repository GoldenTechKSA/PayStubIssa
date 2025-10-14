import React, { useState, useEffect } from 'react';
import { FullTemplate, PayStubDetails } from './types';
import { loadAllTemplates } from '../utils/templateloader';
import TemplateSelector from './templateselector';
import Advanced3ColumnTemplate from './templates/advanced3columntemplate';

interface TemplateRegistryProps {
  store: PayStubDetails;
  id: number;
  canPrintStub: Boolean;
}

const TemplateRegistry: React.FC<TemplateRegistryProps> = ({store, id, canPrintStub}) => {
  const [templates, setTemplates] = useState<FullTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<FullTemplate | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    const loadTemplates = async () => {
      const loadedTemplates = await loadAllTemplates();
      setTemplates(loadedTemplates);
      if (loadedTemplates.length > 0) {
        setSelectedTemplate(loadedTemplates[0]);
      }
      setLoading(false);
    };
    
    loadTemplates();
  }, []);
  
  if (loading) {
    return <div className="text-center p-4">Loading templates...</div>;
  }
  
  return (
    <div className="template-registry max-w-7xl mx-auto p-4`">
      <TemplateSelector id={id} templates={templates} onSelect={setSelectedTemplate}/>
      <div className="mt-4">
        {selectedTemplate && (<Advanced3ColumnTemplate template={selectedTemplate} store={store} styling={selectedTemplate.styling} canPrintStub={canPrintStub as boolean}/>)}
      </div>
    </div>
  );
};

export default TemplateRegistry;