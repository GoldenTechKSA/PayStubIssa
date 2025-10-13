import React from 'react';
import { TemplateProps, SectionDefinition } from '../types';
import EarningsSummaryColumn from '../columns/summary/earningssummarycolumn';
import DeductionsSummaryColumn from '../columns/summary/deductionssummarycolumn';
import FinalSummaryColumn from '../columns/summary/finalsummarycolumn';

interface SummarySectionProps extends TemplateProps {
  summary: SectionDefinition;
}

const SummarySection: React.FC<SummarySectionProps> = ({ summary, store, styling }) => {
  const [earningsColumn, deductionsColumn, finalColumn] = summary.columns;
  
  return (
    <div className={styling.summary_container}>
      <div className="col-md-4"><EarningsSummaryColumn title={earningsColumn.title} fields={earningsColumn.fields} store={store} styling={styling}/></div>
      <div className="col-md-4"><DeductionsSummaryColumn title={deductionsColumn.title} fields={deductionsColumn.fields} store={store} styling={styling} /></div>
      <div className="col-md-4"><FinalSummaryColumn title={finalColumn.title} fields={finalColumn.fields} store={store} styling={styling} /></div>
    </div>
  );
};

export default SummarySection;