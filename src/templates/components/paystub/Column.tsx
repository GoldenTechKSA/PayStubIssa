import React from 'react';
import { FlatPayStubData } from 'assets/data/pay-stub-details';
import type { ColumnConfig } from './types';
import { Table } from './Table';

interface ColumnProps {
  config: ColumnConfig;
  data: FlatPayStubData;
}

/**
 * Column Component
 * Renders a column within a section that can contain multiple tables. Each column has a configurable width (e.g., 25%, 50%, 100%)
 */
export const Column: React.FC<ColumnProps> = ({ config, data }) => {
  const defaultStyle: React.CSSProperties = {width: config.width};
  const columnStyle: React.CSSProperties = {...defaultStyle, ...config.style};
  return (
    <div style={columnStyle}>
      {config.tables.map(table => (<Table key={table.id} config={table} data={data} />))}
    </div>
  );
};

export default Column;