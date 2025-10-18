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
import TemplateRenderer from './templaterenderer';
import { PayStubDetails } from 'assets/data/pay-stub-details';

interface TemplateManagerProps {
  id: number;
  store: PayStubDetails;
}

export const TemplateManager: React.FC<TemplateManagerProps> = ({id, store}) => {
  const [templates, setTemplates] = useState<TemplateMetadata[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [currentConfig, setCurrentConfig] = useState<TemplateConfiguration | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    if (selectedTemplate) {
      loadTemplateConfig(selectedTemplate);
    }
  }, [selectedTemplate]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const availableTemplates = await templateLoader.getAvailableTemplates();
      setTemplates(availableTemplates);
      setError(null);
    } catch (err) {
      setError('Failed to load templates');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplateConfig = async (templateId: string) => {
    try {
      setLoading(true);
      const config = await templateLoader.loadTemplate(templateId);
      if (config) {
        const validation = templateLoader.validateTemplate(config);
        if (!validation.valid) {
          setError(`Template validation failed: ${validation.errors.join(', ')}`);
          return;
        }
        setCurrentConfig(config);
        setError(null);
      } else {
        setError('Template configuration not found');
      }
    } catch (err) {
      setError('Failed to load template configuration');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
  };

  return (
    <div className="">
      {/* select actual paystub*/}
      <TemplateSelector templates={templates} onSelect={handleTemplateSelect} id={id} templateId={selectedTemplate}/>
      {/* Render actual paystub*/}
      {currentConfig && (<div> <TemplateRenderer config={currentConfig} data={store}/></div>)}
      {/* Print footer*/}
      <div className="">
        <p>This document is computer-generated and does not require a signature.</p>
        <p>For questions, please contact your payroll department.</p>
      </div>
    </div>
  );
};

export default TemplateManager;