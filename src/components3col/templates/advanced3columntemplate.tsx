import React from 'react';
import { TemplateProps, TemplateConfig } from '../types';
import HeaderSection from '../sections/headersection';
import BodySection from '../sections/bodysection';
import SummarySection from '../sections/summarysection';

interface Advanced3ColumnTemplateProps extends TemplateProps {
  template: TemplateConfig;
}

const Advanced3ColumnTemplate: React.FC<Advanced3ColumnTemplateProps> = ({ template, store, styling, canPrintStub = true }) => {
  if (!canPrintStub) {
    return <div className="text-center p-4">Paystub not available for printing</div>;
  }
  
  return (
    <div className={styling.container}>
      <HeaderSection header={template.header} store={store} styling={styling} />
      <BodySection body={template.body} store={store} styling={styling} />
      <SummarySection summary={template.summary} store={store} styling={styling} />
    </div>
  );
};

export default Advanced3ColumnTemplate;