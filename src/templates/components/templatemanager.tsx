/**
 * Template Manager Component
 * Main component with print-ready paystub display
 * This is the file that handles loading templates, selecting templates, and rendering the paystub
 * It also includes print-specific styles to ensure the paystub prints correctly
 * 
 * Features: Loads available templates from the public folder, these templates should match the TemplateConfiguration interface
 * and is one to one with the number of templates images in the public/templates/thumbnails folder
 * it will loads the selected template configuration and validate it
 * and render the paystub using the TemplateRenderer component.
 */

import React, { useState, useEffect } from 'react';
import { TemplateConfiguration, TemplateMetadata } from '../types/templatetypes';
import { templateLoader } from '../utils/templateloader';
import TemplateSelector from './templateselector';
import { PayStubDetails } from 'assets/data/pay-stub-details';

import { PaystubRenderer } from './PaystubRenderer';
import { loadPaystubConfig, processDynamicValues, validateConfig } from './paystub/xmlParser';
import type { PaystubConfig, PaystubData } from './paystub/types';

interface TemplateManagerProps {
  id: number;
  store: PayStubDetails;
}

export const TemplateManager: React.FC<TemplateManagerProps> = ({id, store}) => {
  const [config, setConfig] = useState<PaystubConfig | null>(null);
  const [data, setData] = useState<PayStubDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  // Load XML configuration from file using fetch
  useEffect(() => {
    const loadConfigFromFile = async () => {
      try {
        setLoading(true);
        setError(null);

        const fileIndex = id; // Change index to load different sample files
        const filesUrls = [ 
          "/configs/template-simple/paystub-config.xml",
          "/configs/template-prof/paystub-config.xml"
        ];
        const response = await fetch(filesUrls[fileIndex]);
        if (!response.ok) {
          throw new Error(`Failed to load XML file: ${response.statusText}`);
        }

        const parsedConfig = await loadPaystubConfig(filesUrls[fileIndex]);

        const validation = validateConfig(parsedConfig);
        if (!validation.valid) {
          setError(`Configuration errors: ${validation.errors.join(', ')}`);
          return;
        }

        setConfig(parsedConfig);
        
      } catch (err) {
        setError(`Error loading configuration: ${err instanceof Error ? err.message : 'Unknown error'}`);
        console.error('Failed to load XML:', err);
      } finally {
        setLoading(false);
      }
    };

    // Load sample data
    const loadDataFromStore = async () => {
          setData(store);
    };

    loadConfigFromFile();
    loadDataFromStore();
  }, []);

  // Process data when it changes
  useEffect(() => {
    if (config && data) {
      try {
        const processedConfig = processDynamicValues(config, data);
        setConfig(processedConfig);
      } catch (err) {
        setError(`Error processing data: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }
  }, [data]);

    const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
  };
  return (
    <div className="">
      {/* Error Display */}
      {error && (<div style={{maxWidth: '1200px',margin: '0 auto 20px',padding: '15px',backgroundColor: '#fee2e2',color: '#991b1b',borderRadius: '8px',border: '1px solid #fecaca'}}>
          <strong>Error:</strong> {error}
        </div>
      )}
      {/* select actual paystub*/}
      <TemplateSelector templates={{} as TemplateMetadata[]} onSelect={handleTemplateSelect} id={id} templateId={selectedTemplate}/>
      {/* Render actual paystub*/}
      {config && !loading && (<div> <PaystubRenderer config={config} data={store}/></div>)}
    </div>
  );
};

export default TemplateManager;