import React from 'react';
import { TemplateProps, SectionDefinition } from '../types';
import EmployeeDetailsColumn from '../columns/body/employeedetailscolumn';
import EarningsColumn from '../columns/body/earningscolumn';
import DeductionsTaxesColumn from '../columns/body/deductionstaxescolumn';


interface BodySectionProps extends TemplateProps {
  body: SectionDefinition;
}

const BodySection: React.FC<BodySectionProps> = ({ body, store, styling }) => {
  const layoutType = body.columns.length === 2 ? 'col-md-6' : 'col-md-4';
  
  return (
    <div className={styling.body_container}>
      {body.columns.map((column, index) => (
        <div key={column.column_id} className={layoutType}>
          {column.column_id === 'employee_info' && (<EmployeeDetailsColumn title={column.title} fields={column.fields} store={store} styling={styling} />)}
          {column.column_id === 'earnings' && (<EarningsColumn title={column.title} fields={column.fields} store={store} styling={styling} />)}
          {column.column_id === 'deductions_taxes' && (<DeductionsTaxesColumn title={column.title} fields={column.fields} store={store} styling={styling} />)}
          {column.column_id === 'employee_earnings' && ( <EmployeeDetailsColumn fields={column.fields} store={store} styling={styling} />)}
          {column.column_id === 'deductions_taxes_summary' && (<DeductionsTaxesColumn  fields={column.fields} store={store} styling={styling} />)}
        </div>
      ))}
    </div>
  );
};

export default BodySection;