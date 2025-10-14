/**
 * Template Selector Component
 * Displays available templates for user selection
 */

import React, { useEffect } from 'react';
import { TemplateMetadata } from '../types/templatetypes';

interface TemplateSelectorProps {
  id: number;
  templateId: string;
  templates: TemplateMetadata[];
  onSelect: (templateId: string) => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({id, templateId, templates, onSelect}) => {
  useEffect(() => {
    if (templates.length > 0) {
      const index = Math.min(id, templates.length - 1);
      const randomTemplate = templates[index];
      onSelect(randomTemplate.template_id);
    }
  }, [templates, onSelect]);

  // Return null since no UI should be presented
  return null;
};

export default TemplateSelector;