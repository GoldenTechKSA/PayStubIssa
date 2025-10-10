/**
 * Template Manager Component
 * Main component that orchestrates template selection and rendering
 */

import React, { useState, useEffect } from 'react';
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
  initialTemplateId = 'paystub_regular',
  allowEditing = false,
  onDataChange
}) => {
  const [templates, setTemplates] = useState<TemplateMetadata[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>(initialTemplateId);
  const [currentConfig, setCurrentConfig] = useState<TemplateConfiguration | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showJSON, setShowJSON] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'select' | 'preview'>('select');

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
        // Validate template
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
        <div className="bg-red-50 border-red-200">
          <div>
            <strong>Error:</strong> {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation Bar */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
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
            
            {currentConfig && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowJSON(!showJSON)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm"
                >
                  {showJSON ? 'Hide' : 'Show'} JSON
                </button>
                <button
                  onClick={exportConfig}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                >
                  Export Config
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* JSON View */}
      {showJSON && currentConfig && (
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-96">
            <pre className="text-xs">{JSON.stringify(currentConfig, null, 2)}</pre>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4">
        {viewMode === 'select' ? (
          <div>
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
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold">{currentConfig.metadata.title}</h2>
                <p className="text-gray-600 text-sm">{currentConfig.metadata.description}</p>
              </div>
              {allowEditing && (
                <span className="text-sm text-blue-600 font-medium">Editable Mode</span>
              )}
            </div>
            <TemplateRenderer
              config={currentConfig}
              editable={allowEditing}
              onChange={handleDataChange}
            />
          </div>
        ) : (
          <div className="bg-yellow-50 border-yellow-200">
            <div>
              Please select a template to preview
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateManager;