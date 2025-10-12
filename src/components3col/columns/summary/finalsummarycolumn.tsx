import React from 'react';
import { ColumnProps } from '../../types';
import { validateFieldData } from '../../../utils/datavalidator';
import { formatValue } from '../../../utils/formatter';
import { mapStoreToTemplateData } from '../../../utils/datamapper';
import CalculatedField from '../../fields/calculatedfield';

const FinalSummaryColumn: React.FC<ColumnProps> = ({ title, fields, store, styling }) => {
  const templateData = mapStoreToTemplateData(store);
  
  return (
    <div className={styling.column}>
      {title && <h3 className={styling.section_title}>{title}</h3>}
      {fields.map(field => {
        if (!validateFieldData(field, templateData)) return null;
        
        if (field.calculation) {
          return <CalculatedField key={field.field_id} field={field} store={store} styling={styling} />;
        }
        
        const value = templateData[field.field_id];
        const formattedValue = formatValue(value, field);
        
        return (
          <div key={field.field_id} className={styling.field}>
            <span className={styling.field_label}>{field.label}</span>
            <span className={styling.field_value}>{formattedValue}</span>
          </div>
        );
      })}
    </div>
  );
};

export default FinalSummaryColumn;