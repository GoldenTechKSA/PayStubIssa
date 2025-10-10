/**
 * Template Manager Component
 * Main component with print-ready paystub display
 */

import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { TemplateConfiguration, TemplateMetadata } from '../types/templatetypes';
import { templateLoader } from '../utils/templateloader';
import TemplateSelector from './templateselector';
import TemplateRenderer from './templaterenderer';

interface TemplateManagerProps {
  initialTemplateId?: string;
  allowEditing?: boolean;
  onDataChange?: (data: Record<string, any>) => void;
}

export const TemplateManager: React.FC<TemplateManagerProps> = ({
  initialTemplateId = 'classic_blue',
  allowEditing = false,
  onDataChange
}) => {
  const [templates, setTemplates] = useState<TemplateMetadata[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>(initialTemplateId);
  const [currentConfig, setCurrentConfig] = useState<TemplateConfiguration | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showJSON, setShowJSON] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'select' | 'preview'>('preview');

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
    setViewMode('preview');
  };

  const handleDataChange = (data: Record<string, any>) => {
    if (onDataChange) {
      onDataChange(data);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const exportConfig = () => {
    if (currentConfig) {
      const dataStr = JSON.stringify(currentConfig, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${currentConfig.metadata.template_id}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
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

  if (error) {
    return (
      <div className="p-8">
        <Alert className="bg-red-50 border-red-200">
          <AlertDescription>
            <strong>Error:</strong> {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation Bar - Hidden when printing */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10 no-print">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setViewMode('select')}
                className={`px-4 py-2 rounded-lg transition ${
                  viewMode === 'select'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Select Template
              </button>
              <button
                onClick={() => setViewMode('preview')}
                className={`px-4 py-2 rounded-lg transition ${
                  viewMode === 'preview'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                disabled={!currentConfig}
              >
                Preview
              </button>
            </div>
            
            {currentConfig && viewMode === 'preview' && (
              <div className="flex items-center space-x-2">
                <Button
                  onClick={handlePrint}
                  variant="default"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print Paystub
                </Button>
                <button
                  onClick={() => setShowJSON(!showJSON)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm"
                >
                  {showJSON ? 'Hide' : 'Show'} JSON
                </button>
                <button
                  onClick={exportConfig}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm"
                >
                  Export Config
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* JSON View - Hidden when printing */}
      {showJSON && currentConfig && (
        <div className="max-w-7xl mx-auto px-4 no-print">
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-96">
            <pre className="text-xs">{JSON.stringify(currentConfig, null, 2)}</pre>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={viewMode === 'preview' ? 'print-container' : 'max-w-7xl mx-auto px-4'}>
        {viewMode === 'select' ? (
          <div className="no-print">
            <h2 className="text-2xl font-bold mb-4">Choose a Template</h2>
            <TemplateSelector
              templates={templates}
              onSelect={handleTemplateSelect}
              selected={selectedTemplate}
              groupByCategory={false}
            />
          </div>
        ) : currentConfig ? (
          <div>
            {/* Print-friendly header - Only shows when printing */}
            <div className="print-only mb-4 text-center">
              <h1 className="text-2xl font-bold text-gray-800">Employee Pay Statement</h1>
              <p className="text-sm text-gray-600">Confidential Document</p>
            </div>

            {/* Template info - Hidden when printing */}
            <div className="flex items-center justify-between mb-4 no-print">
              <div>
                <h2 className="text-2xl font-bold">{currentConfig.metadata.title}</h2>
                <p className="text-gray-600 text-sm">{currentConfig.metadata.description}</p>
              </div>
              {allowEditing && (
                <span className="text-sm text-blue-600 font-medium">Editable Mode</span>
              )}
            </div>

            {/* The actual paystub */}
            <TemplateRenderer
              config={currentConfig}
              editable={allowEditing}
              onChange={handleDataChange}
            />

            {/* Print footer - Only shows when printing */}
            <div className="print-only mt-8 pt-4 border-t text-center text-xs text-gray-500">
              <p>This document is computer-generated and does not require a signature.</p>
              <p>For questions, please contact your payroll department.</p>
            </div>
          </div>
        ) : (
          <Alert className="bg-yellow-50 border-yellow-200 no-print">
            <AlertDescription>
              Please select a template to preview
            </AlertDescription>
          </Alert>
        )}
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