import React from 'react';

import { FlatPayStubData } from 'assets/data/pay-stub-details';
import type { SectionConfig } from './types';
import { Column } from './Column';

interface SectionProps {
  config: SectionConfig;
  data: FlatPayStubData;
}

/**
 * Section Component
 * Renders a section (row) that can contain up to 4 columns. Sections are stacked vertically on the page
 */
export const Section: React.FC<SectionProps> = ({ config, data }) => {
  const defaultStyle: React.CSSProperties = {display: 'flex'};
  const sectionStyle: React.CSSProperties = {...defaultStyle, ...config.style};
  return (
    <div style={sectionStyle}>
      {config.columns.map(column => (<Column key={column.id} config={column} data={data}/>))}
    </div>
  );
};

export default Section;