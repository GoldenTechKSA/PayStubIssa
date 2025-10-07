import React from 'react';

interface PaystubFooter0Props {
  companyName: string;
  companyFullAddress: string;
  specialNotes?: boolean;
  extraNotes?: string;
}

const PaystubFooter0: React.FC<PaystubFooter0Props> = ({
  companyName,
  companyFullAddress,
  specialNotes,
  extraNotes
}) => {
  return (
    <div className="paystub-footer0 paystub-footer-bottom0">
      <div>This is not a check. For questions about your pay stub, please contact HR.</div>
      <div>{companyName} - Confidential</div>
      <div>{companyFullAddress}</div>
      {specialNotes && extraNotes && <div>{extraNotes}</div>}
    </div>
  );
};

export default PaystubFooter0;