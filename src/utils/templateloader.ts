import { TemplateRegistryItem, FullTemplate } from '../components3col/types';

export const fetchTemplateRegistry = async (): Promise<TemplateRegistryItem[]> => {
  try {
    const response = await fetch('/templates/template-names.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.templates as TemplateRegistryItem[];
  } catch (error) {
    console.error('Error loading template registry:', error);
    return [];
  }
};

export const fetchTemplateConfig = async (configPath: string): Promise<any> => {
  try {
    const response = await fetch(configPath);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const config = await response.json();
    return config;
  } catch (error) {
    console.error('Error loading template config:', error);
    return null;
  }
};

export const loadAllTemplates = async (): Promise<FullTemplate[]> => {
  const registry = await fetchTemplateRegistry();
  console.log("Fetched template registry:", registry);
  const templates: FullTemplate[] = [];
  
  for (const template of registry) {
    const config = await fetchTemplateConfig(template.config_path);
    if (config) {
      templates.push({
        ...template,
        ...config
      });
    }
  }
  
  return templates;
};