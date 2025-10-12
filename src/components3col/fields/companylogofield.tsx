import React from 'react';
import { FieldProps } from '../types';
import { mapStoreToTemplateData } from '../../utils/datamapper';

const CompanyLogoField: React.FC<FieldProps> = ({ field, store, styling }) => {
  const templateData = mapStoreToTemplateData(store);
  const imageUrl = templateData[field.field_id] || '/images/default-logo.png';
  
  return (
    <div className={styling.logo_container}>
      <img 
        src={imageUrl} 
        alt="Company Logo" 
        className={styling.logo}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = '/images/default-logo.png';
        }}
      />
    </div>
  );
};

export default CompanyLogoField;