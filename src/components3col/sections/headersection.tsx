import React from 'react';
import { TemplateProps, SectionDefinition } from '../types';
import CompanyInfoColumn from '../columns/header/companyinfocolumn';
import LogoColumn from '../columns/header/logocolumn';
import PaystubTitleColumn from '../columns/header/paystubtitlecolumn';

interface HeaderSectionProps extends TemplateProps {
  header: SectionDefinition;
}

const HeaderSection: React.FC<HeaderSectionProps> = ({ header, store, styling }) => {
  const layoutType = header.columns.length === 2 ? 'col-md-6' : 'col-md-4';
  
  return (
    <div className={styling.header_container}>
      {header.columns.map((column, index) => (
        <div key={column.column_id} className={layoutType}>
          {column.column_id === 'header_company_info' && ( <CompanyInfoColumn fields={column.fields} store={store} styling={styling}/>)}
          {column.column_id === 'header_logo' && ( <LogoColumn fields={column.fields} store={store} styling={styling} />)}
          {column.column_id === 'header_title' && ( <PaystubTitleColumn fields={column.fields} store={store} styling={styling}/>)}
          {column.column_id === 'header_company_logo' && ( <CompanyInfoColumn fields={column.fields} store={store} styling={styling}/>)}
          {column.column_id === 'header_paystub_info' && ( <PaystubTitleColumn fields={column.fields} store={store} styling={styling}/>)}
        </div>
     ))}
    </div>
  );
};

export default HeaderSection;