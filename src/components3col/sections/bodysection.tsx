import React from 'react';
import { TemplateProps, SectionDefinition } from '../types';
import EmployeeDetailsColumn from '../columns/body/employeedetailscolumn';
import EarningsColumn from '../columns/body/earningscolumn';
import DeductionsTaxesColumn from '../columns/body/deductionstaxescolumn';

interface BodySectionProps extends TemplateProps {
  body: SectionDefinition;
}

const BodySection: React.FC<BodySectionProps> = ({ body, store, styling }) => {
  const [employeeColumn, earningsColumn, deductionsColumn] = body.columns;
  
  return (
    <div className={styling.body_container}>
      <div className="col-md-4"><EmployeeDetailsColumn title={employeeColumn.title} fields={employeeColumn.fields} store={store} styling={styling} /></div>
      <div className="col-md-4"><EarningsColumn title={earningsColumn.title} fields={earningsColumn.fields} store={store} styling={styling} /></div>
      <div className="col-md-4"><DeductionsTaxesColumn title={deductionsColumn.title} fields={deductionsColumn.fields} store={store} styling={styling} /></div>
    </div>
  );
};

export default BodySection;