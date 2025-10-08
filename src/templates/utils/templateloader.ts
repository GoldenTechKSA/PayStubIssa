/**
 * Template Loader Utility
 * Handles loading and caching of template configurations
 */

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

  /**
   * Load the template registry
   */
  async loadRegistry(): Promise<TemplateRegistry> {
    if (this.registry) {
      return this.registry;
    }

    try {
      // In a real application, this would fetch from an API or file system
      // For demo purposes, we'll return a mock registry
      const response = await fetch('/config/template-registry.json');
      this.registry = await response.json();
      if (!this.registry) {
        throw new Error('Invalid registry format');
      }
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

  /**
   * Load a specific template configuration
   */
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

  /**
   * Get all available template metadata
   */
  async getAvailableTemplates(): Promise<TemplateMetadata[]> {
    const registry = await this.loadRegistry();
    return registry.templates;
  }

  /**
   * Search templates by category
   */
  async getTemplatesByCategory(category: string): Promise<TemplateMetadata[]> {
    const templates = await this.getAvailableTemplates();
    return templates.filter(t => t.category === category);
  }

  /**
   * Clear template cache
   */
  clearCache(): void {
    this.templateCache.clear();
  }

  /**
   * Validate template configuration
   */
  validateTemplate(config: TemplateConfiguration): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check metadata
    if (!config.metadata?.template_id) {
      errors.push('Template must have a valid template_id');
    }

    // Check sections
    if (!config.sections || config.sections.length === 0) {
      errors.push('Template must have at least one section');
    }

    // Check fields
    if (!config.fields || config.fields.length === 0) {
      errors.push('Template must have at least one field');
    }

    // Validate field references in sections
    const sectionIds = new Set(config.sections.map(s => s.section_id));
    config.fields.forEach(field => {
      if (!sectionIds.has(field.position.section)) {
        errors.push(`Field ${field.field_id} references non-existent section ${field.position.section}`);
      }
    });

    // Validate calculations
    config.fields.forEach(field => {
      if (field.calculation) {
        const fieldIds = new Set(config.fields.map(f => f.field_id));
        const referencedFields = field.calculation.match(/\w+/g) || [];
        referencedFields.forEach(ref => {
          if (!fieldIds.has(ref) && isNaN(Number(ref))) {
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

  /**
   * Preload multiple templates
   */
  async preloadTemplates(templateIds: string[]): Promise<void> {
    const promises = templateIds.map(id => this.loadTemplate(id));
    await Promise.all(promises);
  }
}

// Export singleton instance
export const templateLoader = TemplateLoader.getInstance();