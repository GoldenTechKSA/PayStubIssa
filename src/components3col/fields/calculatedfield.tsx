import React from 'react';
import { FieldProps } from '../types';
import { calculateField } from '../../utils/fieldcalculator';
import { formatValue } from '../../utils/formatter';
import { mapStoreToTemplateData } from '../../utils/datamapper';

const CalculatedField: React.FC<FieldProps> = ({ field, store, styling }) => {
  const templateData = mapStoreToTemplateData(store);
  const calculatedValue = calculateField(field.calculation!, templateData);
  const formattedValue = formatValue(calculatedValue, field);
  
  const fieldClass = styling.field || 'flex justify-between py-1';

  return (
    <div className={fieldClass}>
      <span className={styling.field_label || 'font-medium text-gray-700'}>
        {field.label}
      </span>
      <span className={styling.field_value || 'text-right font-semibold'}>
        {formattedValue}
      </span>
    </div>
  );
};

export default CalculatedField;