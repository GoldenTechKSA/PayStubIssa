import React from 'react';
import { FieldProps } from '../types';
import { mapStoreToTemplateData } from '../../utils/datamapper';

const ArrayFieldRenderer: React.FC<FieldProps> = ({ field, store, styling }) => {
  const templateData = mapStoreToTemplateData(store);
  const arrayData = templateData[field.field_id];
  
  if (!Array.isArray(arrayData)) {
    return null;
  }
  
  const getArrayColumns = (arrayType: string) => {
    switch (arrayType) {
      case 'earnings':
        return [
          { key: 'description', label: 'Description' },
          { key: 'rate', label: 'Rate' },
          { key: 'hours', label: 'Hours' },
          { key: 'current', label: 'Current' },
          { key: 'ytd', label: 'YTD' }
        ];
      case 'deductions':
      case 'taxes':
        return [
          { key: 'description', label: 'Description' },
          { key: 'current', label: 'Current' },
          { key: 'ytd', label: 'YTD' }
        ];
      default:
        return [{ key: 'description', label: 'Description' }];
    }
  };
  
  const columns = getArrayColumns((field as any).array_type || 'earnings');
  
  return (
    <table className={styling.array_table || "table table-sm w-100"}>
      <thead>
        <tr>
          {columns.map(col => (
            <th key={col.key} className={styling.array_th || "text-start fw-bold bg-light"}>
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {arrayData.map((item: any, index: number) => (
          <tr key={index} className={styling.array_tr || ""}>
            {columns.map(col => (
              <td key={col.key} className={styling.array_td || "text-start py-2"}>
                {item[col.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default ArrayFieldRenderer;