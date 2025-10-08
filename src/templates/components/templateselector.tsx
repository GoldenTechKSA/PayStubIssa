/**
 * Template Selector Component
 * Displays available templates for user selection
 */

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { TemplateMetadata } from '../types/templatetypes';

interface TemplateSelectorProps {
  templates: TemplateMetadata[];
  onSelect: (templateId: string) => void;
  selected: string;
  groupByCategory?: boolean;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  templates,
  onSelect,
  selected,
  groupByCategory = false
}) => {
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Get unique categories
  const categories = Array.from(new Set(templates.map(t => t.category)));

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesFilter = filter === 'all' || template.category === filter;
    const matchesSearch = template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Group templates by category if needed
  const groupedTemplates = groupByCategory
    ? categories.reduce((acc, category) => {
        acc[category] = filteredTemplates.filter(t => t.category === category);
        return acc;
      }, {} as Record<string, TemplateMetadata[]>)
    : { all: filteredTemplates };

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      standard: 'bg-blue-100 text-blue-800',
      modern: 'bg-purple-100 text-purple-800',
      professional: 'bg-gray-100 text-gray-800',
      compact: 'bg-green-100 text-green-800',
      premium: 'bg-yellow-100 text-yellow-800',
      contractor: 'bg-orange-100 text-orange-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const renderTemplateCard = (template: TemplateMetadata) => (
    <Card
      key={template.template_id}
      className={`cursor-pointer transition-all hover:shadow-lg ${
        selected === template.template_id
          ? 'ring-2 ring-blue-500 shadow-lg'
          : 'hover:ring-1 hover:ring-gray-300'
      }`}
      onClick={() => onSelect(template.template_id)}
    >
      {template.thumbnail && (
        <div className="w-full h-32 bg-gray-200 flex items-center justify-center overflow-hidden">
          <img 
            src={template.thumbnail} 
            alt={template.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement!.innerHTML = '<div class="text-gray-400 text-sm">Preview</div>';
            }}
          />
        </div>
      )}
      <CardHeader className="p-4">
        <CardTitle className="text-lg flex items-center justify-between">
          {template.title}
          {selected === template.template_id && (
            <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-sm text-gray-600 mb-2">{template.description}</p>
        <div className="flex items-center justify-between mt-2">
          <span className={`text-xs px-2 py-1 rounded ${getCategoryColor(template.category)}`}>
            {template.category}
          </span>
          <span className="text-xs text-gray-500">v{template.version}</span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Search templates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Categories</option>
          {categories.map(category => (
            <option key={category} value={category}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Template Grid */}
      {groupByCategory ? (
        Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
          categoryTemplates.length > 0 && (
            <div key={category}>
              <h3 className="text-lg font-semibold mb-3 capitalize">
                {category} Templates ({categoryTemplates.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {categoryTemplates.map(renderTemplateCard)}
              </div>
            </div>
          )
        ))
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTemplates.map(renderTemplateCard)}
        </div>
      )}

      {/* No Results */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No templates found</p>
          <p className="text-sm mt-2">Try adjusting your search or filter</p>
        </div>
      )}

      {/* Results Count */}
      {filteredTemplates.length > 0 && (
        <div className="text-sm text-gray-500 text-center">
          Showing {filteredTemplates.length} of {templates.length} templates
        </div>
      )}
    </div>
  );
};

export default TemplateSelector;