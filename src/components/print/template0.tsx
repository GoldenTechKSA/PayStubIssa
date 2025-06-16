import React from 'react';

interface EarningsItem {
  description: string;
  rate?: string;
  hours?: string;
  current: string;
}

interface DeductionItem {
  description: string;
  employee: string;
  employer: string;
}

interface TaxItem {
  description: string;
  amount: string;
}

interface PayStubData {
  company: string;
  employee: {
    name: string;
    id: string;
    ssn: string;
  };
  payDate: string;
  checkNumber: string;
  payPeriod: string;
  earnings: EarningsItem[];
  totalEarnings: string;
  deductions: DeductionItem[];
  totalDeductions: {
    employee: string;
    employer: string;
  };
  taxes: TaxItem[];
  totalTaxes: string;
  grossPay: string;
  deductionsAmount: string;
  taxesAmount: string;
  netPay: string;
  directDeposit: string;
  yearToDate: {
    earnings: string;
    deductions: string;
    taxes: string;
  };
}

const defaultPayStubData: PayStubData = {
  company: "ACME CORPORATION",
  employee: {
    name: "John Doe",
    id: "12345",
    ssn: "***-**-6789"
  },
  payDate: "October 15, 2023",
  checkNumber: "9876",
  payPeriod: "10/01/2023 - 10/15/2023",
  earnings: [
    { description: "Regular Pay", rate: "$25.00", hours: "80.00", current: "$2,000.00" },
    { description: "Overtime", rate: "$37.50", hours: "5.00", current: "$187.50" },
    { description: "Bonus", rate: "-", hours: "-", current: "$100.00" }
  ],
  totalEarnings: "$2,287.50",
  deductions: [
    { description: "Medical", employee: "$75.00", employer: "$150.00" },
    { description: "Dental", employee: "$25.00", employer: "$50.00" },
    { description: "401(k)", employee: "$114.38", employer: "-" }
  ],
  totalDeductions: {
    employee: "$214.38",
    employer: "$200.00"
  },
  taxes: [
    { description: "Federal Income", amount: "$350.00" },
    { description: "Social Security", amount: "$141.83" },
    { description: "Medicare", amount: "$33.17" },
    { description: "State Income", amount: "$125.00" }
  ],
  totalTaxes: "$650.00",
  grossPay: "$2,287.50",
  deductionsAmount: "-$214.38",
  taxesAmount: "-$650.00",
  netPay: "$1,423.12",
  directDeposit: "****1234",
  yearToDate: {
    earnings: "$22,000.00",
    deductions: "$2,100.00",
    taxes: "$6,433.00"
  }
};

interface PayStubProps {
  data?: PayStubData;
}

const PayStub0: React.FC<PayStubProps> = ({ data = defaultPayStubData }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="font-sans text-[10px] bg-gray-100 min-h-screen p-4">
      <style>
        {`
          @media print {
            * {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .no-print {
              display: none !important;
            }
          }
        `}
      </style>
      <div className="text-center mb-2 no-print">
        <button 
          onClick={handlePrint}
          className="px-3 py-2 bg-blue-600 text-white border-none rounded cursor-pointer text-[11px] hover:bg-blue-700"
        >
          Print Pay Stub
        </button>
      </div>
      
      <div className="w-full max-w-[7in] mx-auto bg-white p-2 border border-gray-300">
        {/* Header */}
        <div className="text-center mb-2 pb-1 border-b-2 border-gray-800">
          <div className="text-base font-bold text-blue-600 mb-1">
            {data.company}
          </div>
          <div className="text-sm mt-1">
            EMPLOYEE PAY STUB
          </div>
        </div>
        
        {/* Employee Info Section */}
        <div className="flex flex-wrap mb-2">
          <div className="border border-gray-300 p-1 flex-1 min-w-[30%] m-0.5 text-[9px]">
            <div className="font-bold mb-0.5 text-[9px]">Employee Information</div>
            <div>{data.employee.name}</div>
            <div>ID: {data.employee.id}</div>
            <div>SSN: {data.employee.ssn}</div>
          </div>
          
          <div className="border border-gray-300 p-1 flex-1 min-w-[30%] m-0.5 text-[9px]">
            <div className="font-bold mb-0.5 text-[9px]">Pay Date</div>
            <div>{data.payDate}</div>
            <div className="font-bold mt-1 text-[9px]">Check #</div>
            <div>{data.checkNumber}</div>
          </div>
          
          <div className="border border-gray-300 p-1 flex-1 min-w-[30%] m-0.5 text-[9px]">
            <div className="font-bold mb-0.5 text-[9px]">Pay Period</div>
            <div>{data.payPeriod}</div>
          </div>
        </div>
        
        {/* Earnings and Deductions Row */}
        <div className="flex mb-2 gap-1">
          {/* Earnings Column */}
          <div className="flex-1">
            <h3 className="my-1 text-[11px] font-semibold">Earnings</h3>
            <table className="w-full border-collapse mb-2 text-[8px]">
              <thead>
                <tr>
                  <th className="border border-gray-300 p-1 text-left bg-gray-100 font-bold text-[9px] w-[40%]">Description</th>
                  <th className="border border-gray-300 p-1 text-left bg-gray-100 font-bold text-[9px] w-[15%]">Rate</th>
                  <th className="border border-gray-300 p-1 text-left bg-gray-100 font-bold text-[9px] w-[15%]">Hours</th>
                  <th className="border border-gray-300 p-1 text-left bg-gray-100 font-bold text-[9px] w-[15%]">Current</th>
                </tr>
              </thead>
              <tbody>
                {data.earnings.map((earning, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 p-1">{earning.description}</td>
                    <td className="border border-gray-300 p-1">{earning.rate}</td>
                    <td className="border border-gray-300 p-1">{earning.hours}</td>
                    <td className="border border-gray-300 p-1">{earning.current}</td>
                  </tr>
                ))}
                <tr className="font-bold bg-blue-50">
                  <td className="border border-gray-300 p-1" colSpan={3}>Total Earnings</td>
                  <td className="border border-gray-300 p-1">{data.totalEarnings}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          {/* Deductions Column */}
          <div className="flex-1">
            <h3 className="my-1 text-[11px] font-semibold">Deductions</h3>
            <table className="w-full border-collapse mb-2 text-[8px]">
              <thead>
                <tr>
                  <th className="border border-gray-300 p-1 text-left bg-gray-100 font-bold text-[9px] w-[40%]">Description</th>
                  <th className="border border-gray-300 p-1 text-left bg-gray-100 font-bold text-[9px] w-[15%]">Employee</th>
                  <th className="border border-gray-300 p-1 text-left bg-gray-100 font-bold text-[9px] w-[15%]">Employer</th>
                </tr>
              </thead>
              <tbody>
                {data.deductions.map((deduction, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 p-1">{deduction.description}</td>
                    <td className="border border-gray-300 p-1">{deduction.employee}</td>
                    <td className="border border-gray-300 p-1">{deduction.employer}</td>
                  </tr>
                ))}
                <tr className="font-bold bg-blue-50">
                  <td className="border border-gray-300 p-1">Total Deductions</td>
                  <td className="border border-gray-300 p-1">{data.totalDeductions.employee}</td>
                  <td className="border border-gray-300 p-1">{data.totalDeductions.employer}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Taxes and Pay Summary Row */}
        <div className="flex mb-2 gap-1">
          {/* Taxes Column */}
          <div className="flex-1">
            <h3 className="my-1 text-[11px] font-semibold">Taxes</h3>
            <table className="w-full border-collapse mb-2 text-[8px]">
              <thead>
                <tr>
                  <th className="border border-gray-300 p-1 text-left bg-gray-100 font-bold text-[9px] w-[40%]">Description</th>
                  <th className="border border-gray-300 p-1 text-left bg-gray-100 font-bold text-[9px] w-[15%]">Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.taxes.map((tax, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 p-1">{tax.description}</td>
                    <td className="border border-gray-300 p-1">{tax.amount}</td>
                  </tr>
                ))}
                <tr className="font-bold bg-blue-50">
                  <td className="border border-gray-300 p-1">Total Taxes</td>
                  <td className="border border-gray-300 p-1">{data.totalTaxes}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          {/* Pay Summary Column */}
          <div className="flex-1">
            <h3 className="my-1 text-[11px] font-semibold">Pay Summary</h3>
            <table className="w-full border-collapse mb-2 text-[8px]">
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-1 w-[40%]">Gross Pay</td>
                  <td className="border border-gray-300 p-1 w-[15%]">{data.grossPay}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-1">Deductions</td>
                  <td className="border border-gray-300 p-1">{data.deductionsAmount}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-1">Taxes</td>
                  <td className="border border-gray-300 p-1">{data.taxesAmount}</td>
                </tr>
                <tr className="font-bold bg-blue-50">
                  <td className="border border-gray-300 p-1">Net Pay</td>
                  <td className="border border-gray-300 p-1">{data.netPay}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-1" colSpan={2}>
                    Direct Deposit ({data.directDeposit})
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Year-to-Date Section */}
        <div className="flex flex-wrap mb-2">
          <div className="border border-gray-300 p-1 flex-1 min-w-[30%] m-0.5 text-[9px]">
            <div className="font-bold mb-0.5 text-[9px]">Year-to-Date Earnings</div>
            <div>{data.yearToDate.earnings}</div>
          </div>
          <div className="border border-gray-300 p-1 flex-1 min-w-[30%] m-0.5 text-[9px]">
            <div className="font-bold mb-0.5 text-[9px]">YTD Deductions</div>
            <div>{data.yearToDate.deductions}</div>
          </div>
          <div className="border border-gray-300 p-1 flex-1 min-w-[30%] m-0.5 text-[9px]">
            <div className="font-bold mb-0.5 text-[9px]">YTD Taxes</div>
            <div>{data.yearToDate.taxes}</div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="text-center mt-2 pt-1 border-t border-gray-800 text-[8px] text-gray-600">
          <p>This is not a check. For questions about your pay stub, please contact HR.</p>
          <p>{data.company} - Confidential</p>
        </div>
      </div>
    </div>
  );
};

export default PayStub0;