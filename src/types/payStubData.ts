export interface PayStubData {
  company: {
    name: string;
    address: string;
  };
  employee: {
    name: string;
    id: string;
    ssn: string;
    position: string;
    payRate: string;
    payMethod: string;
  };
  payPeriod: {
    startDate: string;
    endDate: string;
    payDate: string;
  };
  earnings: {
    regular: {
      hours: string;
      rate: string;
      amount: string;
    };
    overtime: {
      hours: string;
      rate: string;
      amount: string;
    };
    bonus: string;
    total: string;
  };
  deductions: {
    federalTax: string;
    stateTax: string;
    socialSecurity: string;
    medicare: string;
    healthInsurance: string;
    retirement401k: string;
    total: string;
  };
  ytd: {
    grossPay: string;
    federalTax: string;
    stateTax: string;
    socialSecurity: string;
    medicare: string;
  };
  payment: {
    netPay: string;
    accountNumber: string;
  };
}