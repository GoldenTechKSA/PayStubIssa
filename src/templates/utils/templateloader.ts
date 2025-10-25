// Template Loader Utility:  * Handles loading and caching of template configurations
import { TemplateConfiguration, TemplateMetadata, TemplateRegistry } from '../types/templatetypes';

export class TemplateLoader {
  private static instance: TemplateLoader;
  private templateCache: Map<string, TemplateConfiguration> = new Map();
  private registry: TemplateRegistry | null = null;

  private constructor() {}

  static getInstance(): TemplateLoader {
    if (!TemplateLoader.instance) {
      TemplateLoader.instance = new TemplateLoader();
    }
    return TemplateLoader.instance;
  }

  //Load the template registry
  async loadRegistry(): Promise<TemplateRegistry> {
    if (this.registry) {
      return this.registry;
    }

    try {
      // In a real application, this would fetch from an API or file system
      // For demo purposes, we'll return a mock registry
      const response = await fetch('/config/template-registry.json');
      this.registry = await response.json();
      if (!this.registry) { throw new Error('Invalid registry format');}
      return this.registry;
    } catch (error) {
      console.error('Failed to load template registry:', error);
      // Return fallback registry
      return {
        version: '1.0.0',
        last_updated: new Date().toISOString(),
        templates: []
      };
    }
  }

  // Load a specific template configuration
  async loadTemplate(templateId: string): Promise<TemplateConfiguration | null> {
    // Check cache first
    if (this.templateCache.has(templateId)) {
      return this.templateCache.get(templateId)!;
    }

    try {
      // In a real application, this would fetch from an API or file system
      const response = await fetch(`/config/templates/${templateId}.json`);
      const config: TemplateConfiguration = await response.json();
      
      // Cache the configuration
      this.templateCache.set(templateId, config);
      
      return config;
    } catch (error) {
      console.error(`Failed to load template ${templateId}:`, error);
      return null;
    }
  }

  // Get all available template metadata
  async getAvailableTemplates(): Promise<TemplateMetadata[]> {
    const registry = await this.loadRegistry();
    return registry.templates;
  }

  // Search templates by category
  async getTemplatesByCategory(category: string): Promise<TemplateMetadata[]> {
    const templates = await this.getAvailableTemplates();
    return templates.filter(t => t.category === category);
  }

  // Clear template cache
  clearCache(): void {
    this.templateCache.clear();
  }

  // Validate template configuration
  // Supports both legacy top-level `fields: []` and the new schema where each section
  // contains its own `fields: []` array. Validation will flatten fields as necessary.
  validateTemplate(config: TemplateConfiguration): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check metadata
    if (!config.metadata?.template_id) {
      errors.push('Template must have a valid template_id');
    }

    // Check sections
    if (!config.sections || !Array.isArray(config.sections) || config.sections.length === 0) {
      errors.push('Template must have at least one section');
    }

    // Gather all fields (support legacy top-level config.fields or nested section.fields)
    let allFields: any[] = [];
    if (Array.isArray((config as any).fields) && (config as any).fields.length > 0) {
      allFields = (config as any).fields;
    } else if (Array.isArray(config.sections)) {
      allFields = config.sections.flatMap((s: any) => Array.isArray(s.fields) ? s.fields : []);
    }

    if (!allFields || allFields.length === 0) {
      errors.push('Template must have at least one field');
    }

    // Validate field.section references against actual section ids
    const sectionIds = new Set((config.sections || []).map(s => s.section_id));
    allFields.forEach(field => {
      const sectionRef = field?.position?.section;
      if (!sectionRef || !sectionIds.has(sectionRef)) {
        errors.push(`Field ${field.field_id} references non-existent section ${sectionRef}`);
      }
    });

    // Validate calculations: referenced fields must exist in the flattened list
    const fieldIds = new Set(allFields.map(f => f.field_id));
    allFields.forEach(field => {
      if (field.calculation && typeof field.calculation === 'string') {
        const referenced = (field.calculation.match(/\b[a-zA-Z_]\w*\b/g) || []).filter(tok => isNaN(Number(tok)));
        referenced.forEach(ref => {
          if (!fieldIds.has(ref)) {
            errors.push(`Field ${field.field_id} calculation references non-existent field ${ref}`);
          }
        });
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const templateLoader = TemplateLoader.getInstance();