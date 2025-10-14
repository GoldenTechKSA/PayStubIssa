/**
 * Template Manager Component
 * Main component with print-ready paystub display
 */

import React, { useState, useEffect } from 'react';
import { TemplateConfiguration, TemplateMetadata } from '../types/templatetypes';
import { templateLoader } from '../utils/templateloader';
import TemplateSelector from './templateselector';
import TemplateRenderer from './templaterenderer';

interface TemplateManagerProps {
  id: number;
}

export const TemplateManager: React.FC<TemplateManagerProps> = ({id}) => {
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
    console.log("Loading template config for:", templateId);
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

  if (loading && !currentConfig) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Content */}
      <TemplateSelector templates={templates} onSelect={handleTemplateSelect} id={id} templateId={selectedTemplate}/>
      <div className={'max-w-7xl mx-auto px-4'}>
        {currentConfig && (
          <div>
            {/* The actual paystub */}
            <TemplateRenderer config={currentConfig}/>
          </div>
        )}
      </div>

      {/* Print footer - Only shows when printing */}
      <div className="print-only mt-8 pt-4 border-t text-center text-xs text-gray-500">
        <p>This document is computer-generated and does not require a signature.</p>
        <p>For questions, please contact your payroll department.</p>
      </div>
      {/* Print-specific styles */}
      <style>{`
        @media print {
          /* Hide everything except the paystub */
          body * {
            visibility: hidden;
          }
          
          .print-container,
          .print-container * {
            visibility: visible;
          }
          
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0.5in;
          }
          
          /* Hide non-print elements */
          .no-print {
            display: none !important;
          }
          
          /* Show print-only elements */
          .print-only {
            display: block !important;
          }
          
          /* Remove shadows and backgrounds for print */
          * {
            box-shadow: none !important;
            text-shadow: none !important;
          }
          
          /* Ensure proper page breaks */
          .print-container {
            page-break-after: auto;
            page-break-inside: avoid;
          }
          
          /* Optimize colors for print */
          body {
            background: white !important;
          }
          
          /* Remove rounded corners for cleaner print */
          * {
            border-radius: 0 !important;
          }
          
          /* Ensure borders print properly */
          .border {
            border: 1px solid #000 !important;
          }
          
          .border-2 {
            border: 2px solid #000 !important;
          }
          
          /* Ensure text is black for better print quality */
          h1, h2, h3, h4, h5, h6, p, span, div, td, th {
            color: #000 !important;
          }
          
          /* Preserve background colors that are important */
          .bg-blue-50,
          .bg-blue-100,
          .bg-gray-50 {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
        
        /* Hide print-only content on screen */
        @media screen {
          .print-only {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default TemplateManager;