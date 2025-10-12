import React from 'react';
import { FieldProps } from '../types';
import { mapStoreToTemplateData } from '../../utils/datamapper';

const PaystubTitleField: React.FC<FieldProps> = ({ field, store, styling }) => {
  const templateData = mapStoreToTemplateData(store);
  
  return (
    <>
      <div className={styling.paystub_title}>Pay Stub</div>
      <div className={styling.paystub_id}>ID: {templateData.paystub_id || 'N/A'}</div>
    </>
  );
};

export default PaystubTitleField;