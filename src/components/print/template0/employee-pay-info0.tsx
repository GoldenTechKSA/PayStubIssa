import React from 'react';

interface EmployeePayInfo0Props {
  employeeFullName: string;
  employeeID: string;
  employeeSSN: string;
  employeeFullAddress: string;
  employeePhone: string;
  employeeEmail: string;
  employeeMarriedStatus: string;
  periodPayDate: string | Date;
  checkNumber: number;
  payPeriod: string;
  paymentMethod: string;
  employmentType: string;
  paymentFrequency: string;
  annualSalary: number;
  formatDate: (date: string | Date) => string;
}

const EmployeePayInfo0: React.FC<EmployeePayInfo0Props> = ({
  employeeFullName,
  employeeID,
  employeeSSN,
  employeeFullAddress,
  employeePhone,
  employeeEmail,
  employeeMarriedStatus,
  periodPayDate,
  checkNumber,
  payPeriod,
  paymentMethod,
  employmentType,
  paymentFrequency,
  annualSalary,
  formatDate
}) => {
  return (
    <div className="paystub-info-row0">
      <div className="paystub-info-col0">
        <table>
          <tbody>
            <tr>
              <td className="paystub-label0">Employee Name:</td>
              <td>{employeeFullName}</td>
            </tr>
            <tr>
              <td className="paystub-label0">Employee ID:</td>
              <td>{employeeID}</td>
            </tr>
            <tr>
              <td className="paystub-label0">SSN:</td>
              <td>{employeeSSN}</td>
            </tr>
            <tr>
              <td className="paystub-label0">Address:</td>
              <td>{employeeFullAddress}</td>
            </tr>
            <tr>
              <td className="paystub-label0">Phone:</td>
              <td>{employeePhone}</td>
            </tr>
            <tr>
              <td className="paystub-label0">Email:</td>
              <td>{employeeEmail}</td>
            </tr>
            <tr>
              <td className="paystub-label0">Filing Status:</td>
              <td>{employeeMarriedStatus}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="paystub-info-col0">
        <table>
          <tbody>
            <tr>
              <td className="paystub-label0">Pay Date:</td>
              <td>{formatDate(periodPayDate)}</td>
            </tr>
            <tr>
              <td className="paystub-label0">Check #:</td>
              <td>{checkNumber}</td>
            </tr>
            <tr>
              <td className="paystub-label0">Pay Period:</td>
              <td>{payPeriod}</td>
            </tr>
            <tr>
              <td className="paystub-label0">Pay Method:</td>
              <td>{paymentMethod}</td>
            </tr>
            <tr>
              <td className="paystub-label0">Employment Type:</td>
              <td>{employmentType}</td>
            </tr>
            <tr>
              <td className="paystub-label0">Pay Frequency:</td>
              <td>{paymentFrequency}</td>
            </tr>
            <tr>
              <td className="paystub-label0">Annual Salary:</td>
              <td>{annualSalary}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeePayInfo0;