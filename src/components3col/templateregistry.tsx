import React, { useState, useEffect } from 'react';
import { FullTemplate, PayStubDetails } from './types';
import { loadAllTemplates } from '../utils/templateloader';
import TemplateSelector from './templateselector';
import Advanced3ColumnTemplate from './templates/advanced3columntemplate';

interface TemplateRegistry0Props {
  store: PayStubDetails;
  canPrintStub: Boolean;
}

const TemplateRegistry: React.FC<TemplateRegistry0Props> = ({store, canPrintStub}) => {
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
  
  console.log("Available store:", store);
  return (
    <div className="template-registry max-w-7xl mx-auto p-4">
      {/* TODO: this is not needed in the final implmentation keep here for now, but commented out 
      MAYBE IN THE FUTURE WHEN WE ENABLE THE CONCEPT OF SELECTING A NEW TEMPLATE AFTER THE USER GET
      HERE WE CAN ENABLE SOME SORT OF TEMPLATE SELECTION CONTROL SO THE USER CAN PREVIEW DIFFERENT TEMPLATES*/}
      {/* <TemplateSelector 
        templates={templates} 
        onSelect={setSelectedTemplate}
        selectedTemplateId={selectedTemplate?.template_id || null}
      /> */}
      
      <div className="mt-8">
        {/* <h2 className="text-lg font-bold mb-4 text-center">Preview</h2> */}
        {selectedTemplate && ( <Advanced3ColumnTemplate template={selectedTemplate} store={store} styling={selectedTemplate.styling} canPrintStub={canPrintStub as boolean} /> )}
      </div>
    </div>
  );
};

export default TemplateRegistry;