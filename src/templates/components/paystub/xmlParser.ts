import { PaystubModel } from 'assets/data/pay-stub-details';
import type { PaystubConfig, SectionConfig, ColumnConfig, TableConfig, TableCellConfig, CellFormat, StyleConfig, TableHeaderConfig, TableHeaderDataConfig} from './types';

/**
 * Parses a style element from XML and converts it to a StyleConfig object
 */
const parseStyle = (element: Element | null): StyleConfig | undefined => {
  if (!element) return undefined;
  
  const styleElement = element.querySelector(':scope > style');
  if (!styleElement) return undefined;

  const style: StyleConfig = {};
  Array.from(styleElement.children).forEach(child => {
    const key = child.tagName;
    const value = child.textContent || '';
    style[key] = value;
  });
  
  return Object.keys(style).length > 0 ? style : undefined;
};

/**
 * Parses a table cell element from XML
 */
const parseTableCell = (cellElement: Element): TableCellConfig => {
  const colspanAttr = cellElement.getAttribute('colspan');
  const formatAttr = cellElement.getAttribute('format');
  return {
    id: cellElement.getAttribute('id') || '',
    colspan: colspanAttr ? Number(colspanAttr) : undefined,
    value: cellElement.querySelector('value')?.textContent || '',
    type: (cellElement.getAttribute('type') as 'static' | 'calculated' | 'substitute' | 'image') || 'static',
    formula: cellElement.querySelector('formula')?.textContent || undefined,
    format: (formatAttr as CellFormat) || undefined,
    style: parseStyle(cellElement)
  };
};

/**
 * Parses a table header data element from XML
 */
const parseTableHeaderData = (hdElement: Element): TableHeaderDataConfig => {
  const colspanAttr = hdElement.getAttribute('colspan');
  return {
    id: hdElement.getAttribute('id') || '',
    colspan: colspanAttr ? Number(colspanAttr) : undefined,
    label: hdElement.querySelector('label')?.textContent || '',
    style: parseStyle(hdElement)
  };
};

/**
 * Parses a table header element from XML
 */
const parseTableHeader = (headerElement: Element): TableHeaderConfig => {
  return {
    title: headerElement.getAttribute('title') || '',
    style: parseStyle(headerElement),
    hdata: Array.from(headerElement.querySelectorAll(':scope > hdata > hd')).map(parseTableHeaderData)
  };
};

/**
 * Parses a table element from XML
 */
const parseTable = (tableElement: Element): TableConfig => {
  const headerElement = tableElement.querySelector(':scope > header');
  const rowElements = Array.from(tableElement.querySelectorAll(':scope > cells > rowcells'));
  const cellsByRow = rowElements.length > 0
    ? rowElements.map(rowEl => Array.from(rowEl.querySelectorAll(':scope > cell')).map(parseTableCell))
    : [Array.from(tableElement.querySelectorAll(':scope > cells > cell')).map(parseTableCell)];

  return {
    id: tableElement.getAttribute('id') || '',
    header: headerElement ? parseTableHeader(headerElement) : undefined,
    cells: cellsByRow,
    style: parseStyle(tableElement),
    renderIf: tableElement.getAttribute('renderIf') || undefined
  };
};

/**
 * Parses a column element from XML
 */
const parseColumn = (columnElement: Element): ColumnConfig => {
  return {
    id: columnElement.getAttribute('id') || '',
    width: columnElement.getAttribute('width') || '25%',
    tables: Array.from(columnElement.querySelectorAll(':scope > table')).map(parseTable),
    style: parseStyle(columnElement),
    renderIf: columnElement.getAttribute('renderIf') || undefined
  };
};

/**
 * Parses a section element from XML
 */
const parseSection = (sectionElement: Element): SectionConfig => {
  return {
    id: sectionElement.getAttribute('id') || '',
    columns: Array.from(sectionElement.querySelectorAll(':scope > column')).map(parseColumn),
    style: parseStyle(sectionElement),
    renderIf: sectionElement.getAttribute('renderIf') || undefined
  };
};

/**
 * Main function to parse XML string into PaystubConfig
 */
export const parseXMLToConfig = (xmlString: string): PaystubConfig => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(stripXmlDeclaration(xmlString), 'text/xml');

  // Check for parsing errors
  const parserError = xmlDoc.querySelector('parsererror');
  if (parserError) {
    throw new Error('XML parsing error: ' + parserError.textContent);
  }

  const paystubElement = xmlDoc.querySelector('paystub');
  if (!paystubElement) {
    throw new Error('Invalid XML: missing <paystub> root element');
  }

  const sections = Array.from(paystubElement.querySelectorAll(':scope > section')).map(parseSection);
  const globalStyle = parseStyle(paystubElement);

  return { sections, globalStyle };
};

const getAbsoluteUrl = (url: string, base?: string): string => {
  try {
    return new URL(url, base ?? window.location.href).toString();
  } catch {
    return url;
  }
};

const stripXmlDeclaration = (xml: string): string => {
  let cleaned = xml.replace(/\uFEFF/g, ''); // remove BOM
  cleaned = cleaned.trim();
  // Remove XML declaration if it appears before the root element
  cleaned = cleaned.replace(/^\s*<\?xml[^>]*\?>\s*/i, '');
  return cleaned;
};

const fetchXml = async (url: string): Promise<string> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load XML config from ${url}: ${response.status} ${response.statusText}`);
  }
  const text = await response.text();
  return stripXmlDeclaration(text);
};

const resolveIncludes = async (
  xmlString: string,
  baseUrl: string,
  visited = new Set<string>(),
  depth = 0
): Promise<string> => {
  if (depth > 10) {
    throw new Error('Exceeded maximum include depth (possible cyclic include)');
  }

  const baseAbsolute = getAbsoluteUrl(baseUrl);
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(stripXmlDeclaration(xmlString), 'text/xml');
  const parserError = xmlDoc.querySelector('parsererror');
  if (parserError) {
    throw new Error('XML parsing error when resolving includes: ' + parserError.textContent);
  }

  const includeElements = Array.from(xmlDoc.querySelectorAll('include[href]'));
  if (!includeElements.length) {
    return stripXmlDeclaration(xmlString);
  }

  for (const includeEl of includeElements) {
    const href = includeEl.getAttribute('href');
    if (!href) continue;

    const includeUrl = getAbsoluteUrl(href, baseAbsolute);
    if (visited.has(includeUrl)) {
      // Prevent infinite loops from cyclic includes
      includeEl.remove();
      continue;
    }

    visited.add(includeUrl);
    const includedXml = await fetchXml(includeUrl);
    const includedResolved = await resolveIncludes(includedXml, includeUrl, visited, depth + 1);

    const includedDoc = parser.parseFromString(stripXmlDeclaration(includedResolved), 'text/xml');
    const includedRoot = includedDoc.documentElement;
    if (!includedRoot) {
      includeEl.remove();
      continue;
    }

    const importedNode = xmlDoc.importNode(includedRoot, true);
    includeEl.parentNode?.replaceChild(importedNode, includeEl);
  }

  return new XMLSerializer().serializeToString(xmlDoc);
};

export const loadPaystubConfig = async (configUrl: string): Promise<PaystubConfig> => {
  const xmlString = await fetchXml(configUrl);
  const mergedXml = await resolveIncludes(xmlString, configUrl);
  return parseXMLToConfig(mergedXml);
};

/**
 * Processes dynamic values in the configuration
 * Replaces {path.to.value} placeholders with actual data
 */
export const processDynamicValues = (config: PaystubConfig, data: PaystubModel): PaystubConfig => {
  const processedConfig = JSON.parse(JSON.stringify(config)); // Deep clone

  processedConfig.sections.forEach((section: SectionConfig) => {
    section.columns.forEach((column: ColumnConfig) => {
      column.tables.forEach((table: TableConfig) => {
        // Process header data if present
        if (table.header?.hdata) {
          table.header.hdata.forEach((hd: TableHeaderDataConfig) => {
            if (typeof hd.label === 'string' && hd.label.includes('{')) {
              hd.label = hd.label.replace(/\{([^}]+)\}/g, (_, path) => {
                const keys = path.split('.');
                let value: any = data;
                for (const key of keys) {
                  value = value?.[key];
                }
                return value?.toString() || '';
              });
            }
          });
        }

        // Process table cells
        table.cells.forEach((row: TableCellConfig[]) => {
          row.forEach((cell: TableCellConfig) => {
            if (cell.type === 'static' && typeof cell.value === 'string' && cell.value.includes('{')) {
              cell.value = cell.value.replace(/\{([^}]+)\}/g, (_, path) => {
                const keys = path.split('.');
                let value: any = data;
                for (const key of keys) {
                  value = value?.[key];
                }
                return value?.toString() || '';
              });
            }
          });
        });
      });
    });
  });

  return processedConfig;
};

/**
 * Validates the XML configuration structure
 */
export const validateConfig = (config: PaystubConfig): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!config.sections || config.sections.length === 0) {
    errors.push('Configuration must have at least one section');
  }

  config.sections.forEach((section, sIdx) => {
    if (!section.id) {
      errors.push(`Section ${sIdx} is missing an id`);
    }

    if (!section.columns || section.columns.length === 0) {
      errors.push(`Section ${section.id} must have at least one column`);
    }

    if (section.columns && section.columns.length > 4) {
      errors.push(`Section ${section.id} has more than 4 columns (${section.columns.length})`);
    }

    section.columns?.forEach((column, cIdx) => {
      if (!column.id) {
        errors.push(`Column ${cIdx} in section ${section.id} is missing an id`);
      }

      column.tables?.forEach((table, tIdx) => {
        if (!table.id) {
          errors.push(`Table ${tIdx} in column ${column.id} is missing an id`);
        }

        if (!table.cells || table.cells.length === 0 || table.cells.every(row => row.length === 0)) {
          errors.push(`Table ${table.id} must have at least one cell`);
        }
      });
    });
  });

  return {
    valid: errors.length === 0,
    errors
  };
};