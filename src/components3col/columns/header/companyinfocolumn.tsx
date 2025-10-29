import React from 'react';
import { ColumnProps } from '../../types';
import { validateFieldData } from '../../../utils/datavalidator';
import { formatValue } from '../../../utils/formatter';
import { mapStoreToTemplateData } from '../../../utils/datamapper';

const CompanyInfoColumn: React.FC<ColumnProps> = ({ fields, store, styling }) => {
  const templateData = mapStoreToTemplateData(store);
  
  return (
    <div className={styling.column}>
      {fields.map(field => {
        if (!validateFieldData(field, templateData)) return null;
        
        const value = templateData[field.field_id];
        const formattedValue = formatValue(value, field);
        
        return (
          <div key={field.field_id} className={styling.field}>
            <span className={field.field_id === "company_name" ? styling.company_name_field : styling.field_content}>
              {field.label} {formattedValue}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default CompanyInfoColumn;