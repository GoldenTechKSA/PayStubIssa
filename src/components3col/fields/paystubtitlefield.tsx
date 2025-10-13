import React from 'react';
import { FieldProps } from '../types';
import { mapStoreToTemplateData } from '../../utils/datamapper';

const PaystubTitleField: React.FC<FieldProps> = ({ field, store, styling }) => {
  const templateData = mapStoreToTemplateData(store);
  
  return (
    <>
      <div className={styling.paystub_title}>{field.label}</div>
    </>
  );
};

export default PaystubTitleField;