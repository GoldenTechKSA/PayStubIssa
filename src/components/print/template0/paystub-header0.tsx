import React from 'react';

interface PaystubHeader0Props {
  companyInfo: {
    companyLogo?: string;
  };
  companyName: string;
  companyFullAddress: string;
  companyPhone?: string;
  companyEmail?: string;
  companyEIN?: string;
  payStubNumber?: number;
  renderCompanyLogo: (logoUrl: string) => React.ReactNode;
}

const PaystubHeader0: React.FC<PaystubHeader0Props> = ({
  companyInfo,
  companyName,
  companyFullAddress,
  companyPhone,
  companyEmail,
  companyEIN,
  payStubNumber,
  renderCompanyLogo
}) => {
  return (
    <div className="paystub-header0">
      {/* Company Logo */}
      {companyInfo.companyLogo && renderCompanyLogo(companyInfo.companyLogo)}
      <div className="paystub-header-company0">
        <div className="paystub-header-company-name0">{companyName}</div>
        <div className="paystub-header-company-address0">{companyFullAddress}</div>
        <div className="paystub-header-company-contact0">
          {companyPhone}
          {companyPhone && companyEmail ? " | " : ""}
          {companyEmail}
        </div>
        <div className="paystub-header-company-ein0">
          {companyEIN && `EIN: ${companyEIN}`}
        </div>
      </div>
      <div className="">
        <div className="paystub-header-title0">PAY STUB</div>
        <div className="paystub-header-company-ein0">
          {payStubNumber && `Paystub ID: ${payStubNumber}`}
        </div>
      </div>
    </div>
  );
};

export default PaystubHeader0;