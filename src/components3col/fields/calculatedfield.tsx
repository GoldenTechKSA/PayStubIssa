import React from 'react';
import { FieldProps } from '../types';
import { calculateField } from '../../utils/fieldcalculator';
import { formatValue } from '../../utils/formatter';
import { mapStoreToTemplateData } from '../../utils/datamapper';

const CalculatedField: React.FC<FieldProps> = ({ field, store, styling }) => {
  const templateData = mapStoreToTemplateData(store);
  const calculatedValue = calculateField(field.calculation!, templateData);
  const formattedValue = formatValue(calculatedValue, field);
  
  const fieldClass = styling.field || 'py-2 px-1';
  const contentClass = styling.field_content || 'fw-medium';

  return (
    <div className={fieldClass}>
      <span className={contentClass}>
        {field.label}: {formattedValue}
      </span>
    </div>
  );
};

export default CalculatedField;