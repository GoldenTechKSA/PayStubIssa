/**
 * Template Selector Component
 * maps the template selected by the user in carousel component to the template configuration
 * and passes it to the TemplateRenderer component to render the paystub
 * 
 * Note: This component does not render any UI, it only handles the logic of selecting a template
 * and passing the selected template configuration to the TemplateRenderer component.
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