import React from 'react';
import type { PaystubConfig, PaystubData } from './paystub/types';
import { PayStubDetails } from 'assets/data/pay-stub-details';
import { Section } from './paystub/Section';

interface PaystubRendererProps {
  config: PaystubConfig;
  data: PayStubDetails;
}

/**
 * PaystubRenderer Component
 * Main component that renders the complete paystub. Applies global styling and renders all sections
 */
export const PaystubRenderer: React.FC<PaystubRendererProps> = ({ config, data }) => {
  const defaultStyle: React.CSSProperties = {};
  const containerStyle: React.CSSProperties = {...defaultStyle, ...config.globalStyle};
  return (
    <div style={containerStyle}>
      {config.sections.map(section => (<Section key={section.id} config={section} data={data}/>))}
    </div>
  );
};

export default PaystubRenderer;