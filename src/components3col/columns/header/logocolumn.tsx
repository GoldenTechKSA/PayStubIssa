import React from 'react';
import { ColumnProps } from '../../types';
import CompanyLogoField from '../../fields/companylogofield';

const LogoColumn: React.FC<ColumnProps> = ({ fields, store, styling }) => {
  const logoField = fields.find(f => f.data_type === 'image');
  
  if (!logoField) return null;
  
  return (
    <div className={styling.column}>
      <CompanyLogoField field={logoField} store={store} styling={styling} />
    </div>
  );
};

export default LogoColumn;