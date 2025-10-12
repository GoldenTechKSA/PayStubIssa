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
    <table className={styling.array_table || "w-full text-sm"}>
      <thead>
        <tr>
          {columns.map(col => (
            <th key={col.key} className={styling.array_th || "text-left py-1 border-b font-medium"}>
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {arrayData.map((item: any, index: number) => (
          <tr key={index} className={styling.array_tr || "hover:bg-gray-50"}>
            {columns.map(col => (
              <td key={col.key} className={styling.array_td || "py-1"}>
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