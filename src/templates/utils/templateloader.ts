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

  // Load the template registry
  async loadRegistry(): Promise<TemplateRegistry> {
    if (this.registry) {
      return this.registry;
    }

    try {
      const response = await fetch('/config/template-registry.json');
      this.registry = await response.json();
      if (!this.registry) { throw new Error('Invalid registry format');}
      return this.registry;
    } catch (error) {
      console.error('Failed to load template registry:', error);
      return {
        version: '1.0.0',
        last_updated: new Date().toISOString(),
        templates: []
      };
    }
  }

  // Load a specific template configuration
  async loadTemplate(templateId: string): Promise<TemplateConfiguration | null> {
    if (this.templateCache.has(templateId)) {
      return this.templateCache.get(templateId)!;
    }

    try {
      const response = await fetch(`/config/templates/${templateId}.json`);
      const config: TemplateConfiguration = await response.json();
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

  // Validate template configuration (strict new schema)
  validateTemplate(config: TemplateConfiguration): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Metadata checks
    if (!config || typeof config !== 'object') {
      errors.push('Invalid template configuration object');
      return { valid: false, errors };
    }
    if (!config.metadata || !config.metadata.template_id) {
      errors.push('Template must have a valid metadata.template_id');
    }

    // Sections checks
    if (!Array.isArray(config.sections) || config.sections.length === 0) {
      errors.push('Template must have at least one section');
      return { valid: false, errors };
    }

    // Enforce no legacy top-level fields property
    if (Object.prototype.hasOwnProperty.call(config as any, 'fields')) {
      errors.push('Top-level "fields" is not allowed in the new schema. Move fields under sections[].columns[].fields');
    }

    // Collect all fields and validate columns/fields structure
    const allFields: any[] = [];
    config.sections.forEach((sec, si) => {
      if (!sec.section_id) {
        errors.push(`Section[${si}] is missing section_id`);
      }
      if (!Array.isArray((sec as any).columns) || (sec as any).columns.length === 0) {
        errors.push(`Section "${sec.section_id || `index ${si}`}" must have a non-empty columns array`);
        return;
      }
      (sec as any).columns.forEach((col: any, ci: number) => {
        if (!Array.isArray(col.fields) || col.fields.length === 0) {
          errors.push(`Section "${sec.section_id}" column[${ci}] must have a non-empty fields array`);
          return;
        }
        col.fields.forEach((f: any, fi: number) => {
          if (!f || typeof f !== 'object') {
            errors.push(`Section "${sec.section_id}" column[${ci}] field[${fi}] is invalid`);
            return;
          }
          if (!f.field_id) {
            errors.push(`Field in section "${sec.section_id}" column[${ci}] missing field_id`);
          }
          // If position.section is present, it must match parent section_id
          if (f.position && f.position.section && f.position.section !== sec.section_id) {
            errors.push(`Field "${f.field_id}" position.section "${f.position.section}" does not match parent section "${sec.section_id}"`);
          }
          allFields.push(f);
        });
      });
    });

    if (allFields.length === 0) {
      errors.push('Template must contain at least one field under sections[].columns[].fields');
      return { valid: false, errors };
    }

    // Unique field_id check
    const seen = new Set<string>();
    allFields.forEach(f => {
      if (f.field_id) {
        if (seen.has(f.field_id)) {
          errors.push(`Duplicate field_id detected: ${f.field_id}`);
        } else {
          seen.add(f.field_id);
        }
      }
    });

    // Validate calculations reference existing field ids
    const fieldIds = new Set(allFields.map(f => f.field_id));
    allFields.forEach(f => {
      if (f.calculation && typeof f.calculation === 'string') {
        const referenced = (f.calculation.match(/\b[a-zA-Z_]\w*\b/g) || []).filter(tok => isNaN(Number(tok)));
        const invalid = referenced.filter(ref => !fieldIds.has(ref));
        if (invalid.length) {
          errors.push(`Field ${f.field_id} calculation references non-existent fields: ${invalid.join(', ')}`);
        }
      }
    });

    return { valid: errors.length === 0, errors };
  }
}

// Export singleton instance
export const templateLoader = TemplateLoader.getInstance();