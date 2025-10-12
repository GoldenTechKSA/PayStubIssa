import React from 'react';
import { TemplateProps, SectionDefinition } from '../types';
import CompanyInfoColumn from '../columns/header/companyinfocolumn';
import LogoColumn from '../columns/header/logocolumn';
import PaystubTitleColumn from '../columns/header/paystubtitlecolumn';

interface HeaderSectionProps extends TemplateProps {
  header: SectionDefinition;
}

const HeaderSection: React.FC<HeaderSectionProps> = ({ header, store, styling }) => {
  const [companyColumn, logoColumn, titleColumn] = header.columns;
  
  return (
    <div className={styling.header_container}>
      <CompanyInfoColumn 
        fields={companyColumn.fields} 
        store={store} 
        styling={styling} 
      />
      <LogoColumn 
        fields={logoColumn.fields} 
        store={store} 
        styling={styling} 
      />
      <PaystubTitleColumn 
        fields={titleColumn.fields} 
        store={store} 
        styling={styling} 
      />
    </div>
  );
};

export default HeaderSection;