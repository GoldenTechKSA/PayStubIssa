import React from 'react';
import { TemplateProps, SectionDefinition } from '../types';
import EarningsSummaryColumn from '../columns/summary/earningssummarycolumn';
import DeductionsSummaryColumn from '../columns/summary/deductionssummarycolumn';
import FinalSummaryColumn from '../columns/summary/finalsummarycolumn';

interface SummarySectionProps extends TemplateProps {
  summary: SectionDefinition;
}

const SummarySection: React.FC<SummarySectionProps> = ({ summary, store, styling }) => {
  const layoutType = summary.columns.length === 2 ? 'col-md-6' : 'col-md-4';
  
  return (
    <div className={styling.summary_container}>
      {summary.columns.map((column, index) => (
        <div key={column.column_id} className={layoutType}>
          {column.column_id === 'summary_earnings' && (<EarningsSummaryColumn title={column.title} fields={column.fields} store={store} styling={styling} />)}
          {column.column_id === 'summary_deductions' && (<DeductionsSummaryColumn title={column.title} fields={column.fields} store={store} styling={styling} />)}
          {column.column_id === 'summary_totals' && (<FinalSummaryColumn title={column.title} fields={column.fields} store={store} styling={styling} />)}
          {column.column_id === 'summary_details' && (<EarningsSummaryColumn fields={column.fields} store={store} styling={styling} />)}
          {column.column_id === 'summary_net_pay' && (<FinalSummaryColumn fields={column.fields} store={store} styling={styling} />)}
        </div>
      ))}
    </div>
  );
};

export default SummarySection;