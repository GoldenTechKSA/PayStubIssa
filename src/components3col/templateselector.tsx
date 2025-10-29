import React, { useEffect } from 'react';
import * as templateIds from "../constants/template-ids";
import { FullTemplate } from './types';

interface TemplateSelectorProps {
  id: number;
  templates: FullTemplate[];
  onSelect: (template: FullTemplate) => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ id, templates, onSelect }) => {
  const getTemplateIndex = (id: number): number => {
    // Ensure the index is within bounds
    return Math.min(id, templates.length - 1);
  }

  useEffect(() => {
    if (templates.length > 0) {
      // Select a random template
      //      const randomIndex = Math.floor(Math.random() * templates.length);
      const index = getTemplateIndex(id);
      const template = templates[index];
      onSelect(template);
    }
  }, [templates, onSelect]);

  // Return null since no UI should be presented
  return null;
};

export default TemplateSelector;