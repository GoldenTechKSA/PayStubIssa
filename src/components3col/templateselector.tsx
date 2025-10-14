import React, { useEffect } from 'react';
import * as templateIds from "../constants/template-ids";
import { FullTemplate } from './types';

interface TemplateSelectorProps {
  id: number;
  templates: FullTemplate[];
  onSelect: (template: FullTemplate) => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ id, templates, onSelect }) => {
  useEffect(() => {
    if (templates.length > 0) {
      // Select a random template
      //      const randomIndex = Math.floor(Math.random() * templates.length);
      const index = Math.min(id, templates.length - 1);
      const randomTemplate = templates[index];
      onSelect(randomTemplate);
    }
  }, [templates, onSelect]);

  // Return null since no UI should be presented
  return null;
};

export default TemplateSelector;