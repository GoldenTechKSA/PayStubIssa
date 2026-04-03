import React from 'react';
import { PayStubDetails } from 'assets/data/pay-stub-details';
import type { TableConfig } from './types';
import { TableCell } from './TableCell';

interface TableProps {
  config: TableConfig;
  data: PayStubDetails;
}

/**
 * Table Component
 * Renders a table with a header and multiple cells
 * Each table can have independent styling
 */
export const Table: React.FC<TableProps> = ({ config, data }) => {
  const defaultTableStyle: React.CSSProperties = { borderCollapse: 'collapse'};
  const defaultHeaderStyle: React.CSSProperties = {textAlign: 'left'};
  const headerStyle: React.CSSProperties = {...defaultHeaderStyle, ...config.header?.style};
  const tableStyle: React.CSSProperties = {...defaultTableStyle, ...config?.style};


  return (
    <div>
      {config.header?.title && (<div style={headerStyle}>{config.header.title}</div>)}
      <table style={tableStyle}>
        {config.header?.hdata && config.header.hdata.length > 0 && (
          <thead style={headerStyle}>
            <tr>
              {config.header.hdata.map((hd) => (
                <th key={hd.id} style={hd.style} colSpan={hd.colspan ?? 1}>
                  <span>{hd.label}</span>
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {config.cells.map((row, rowIndex) => (
            <tr key={`${config.id}-row-${rowIndex}`}>
              {row.map(cell => (
                <TableCell key={cell.id} config={cell} data={data} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;