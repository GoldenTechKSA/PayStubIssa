import React, { useState } from 'react';
import { Calculator, DollarSign, FileText, MapPin } from 'lucide-react';
import { taxCalculator } from '../../utils/tax-calculator';
import { TaxCalculationInput, TaxCalculationResult, FilingStatus } from "../../types/tax-rate-types";


// Mock data for demonstration (in real implementation, import from separate files)
const STATE_TAX_DATA = {
  CA: { stateName: 'California', stateCode: 'CA' },
  TX: { stateName: 'Texas', stateCode: 'TX' },
  NY: { stateName: 'New York', stateCode: 'NY' },
  FL: { stateName: 'Florida', stateCode: 'FL' },
  WA: { stateName: 'Washington', stateCode: 'WA' },
  IL: { stateName: 'Illinois', stateCode: 'IL' },
  PA: { stateName: 'Pennsylvania', stateCode: 'PA' },
  OH: { stateName: 'Ohio', stateCode: 'OH' },
  GA: { stateName: 'Georgia', stateCode: 'GA' },
  NC: { stateName: 'North Carolina', stateCode: 'NC' }
};

const DailySpecialPage = () => {
  const [formData, setFormData] = useState({
    grossIncome: '',
    filingStatus: 'single',
    stateCode: 'CA',
    additionalDeductions: ''
  });

  const [results, setResults] = useState<TaxCalculationResult>({
    federalIncomeTax: 0,
    stateIncomeTax: 0,
    socialSecurityTax: 0,
    medicareTax: 0,
    totalTaxes: 0,
    netIncome: 0,
    effectiveTaxRate: 0
  });
  const [isCalculating, setIsCalculating] = useState(false);

  const convertFormData = (input) => {
    const grossIncome = parseFloat(input.grossIncome) || 0;
    const filingStatus = input.filingStatus as FilingStatus;
    const stateCode = input.stateCode || 'CA';
    const additionalDeductions = parseFloat(input.additionalDeductions) || 0;
    return { grossIncome, filingStatus, stateCode, additionalDeductions} as TaxCalculationInput;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsCalculating(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    const result: TaxCalculationResult = taxCalculator.calculateTaxes(convertFormData(formData)); ;

    console.log(`Total taxes: $${result.totalTaxes}`);
    console.log(`Net income: $${result.netIncome}`);
    console.log(`Effective rate: ${result.effectiveTaxRate}%`);    

    setResults(result);
    setIsCalculating(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Calculator className="h-12 w-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-800">Tax Calculator</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Calculate your federal, state, Social Security, and Medicare taxes across all 50 states
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
              <FileText className="h-6 w-6 mr-2 text-blue-600" />
              Tax Information
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="h-4 w-4 inline mr-1" />
                  Gross Annual Income
                </label>
                <input
                  type="number"
                  name="grossIncome"
                  value={formData.grossIncome}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="e.g., 75000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filing Status
                </label>
                <select
                  name="filingStatus"
                  value={formData.filingStatus}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  <option value="single">Single</option>
                  <option value="marriedFilingJointly">Married Filing Jointly</option>
                  <option value="marriedFilingSeparately">Married Filing Separately</option>
                  <option value="headOfHousehold">Head of Household</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  State
                </label>
                <select
                  name="stateCode"
                  value={formData.stateCode}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  {Object.values(STATE_TAX_DATA).map(state => (
                    <option key={state.stateCode} value={state.stateCode}>
                      {state.stateName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Deductions (Optional)
                </label>
                <input
                  type="number"
                  name="additionalDeductions"
                  value={formData.additionalDeductions}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="e.g., 5000"
                />
              </div>

              <button
                type="submit"
                disabled={isCalculating || !formData.grossIncome}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                {isCalculating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Calculating...
                  </>
                ) : (
                  <>
                    <Calculator className="h-5 w-5 mr-2" />
                    Calculate Taxes
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Results Display */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
              <DollarSign className="h-6 w-6 mr-2 text-green-600" />
              Tax Breakdown
            </h2>
            
            {results ? (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-700 mb-3">Tax Components</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Federal Income Tax:</span>
                      <span className="font-semibold text-red-600">
                        {formatCurrency(results.federalIncomeTax)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Social Security Tax:</span>
                      <span className="font-semibold text-red-600">
                        {formatCurrency(results.socialSecurityTax)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Medicare Tax:</span>
                      <span className="font-semibold text-red-600">
                        {formatCurrency(results.medicareTax)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">State Income Tax:</span>
                      <span className="font-semibold text-red-600">
                        {formatCurrency(results.stateIncomeTax)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center text-lg">
                      <span className="font-semibold text-gray-700">Total Taxes:</span>
                      <span className="font-bold text-red-600">
                        {formatCurrency(results.totalTaxes)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-lg">
                      <span className="font-semibold text-gray-700">Net Income:</span>
                      <span className="font-bold text-green-600">
                        {formatCurrency(results.netIncome)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Effective Tax Rate:</span>
                      <span className="font-semibold text-blue-600">
                        {results.effectiveTaxRate.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
                  <h4 className="font-semibold text-yellow-800 mb-2">Important Notes:</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• This is a simplified calculation for demonstration purposes</li>
                    <li>• Actual tax calculations may vary based on additional factors</li>
                    <li>• Consult a tax professional for accurate tax planning</li>
                    <li>• State tax rates and brackets change periodically</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Calculator className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  Enter your income information and click "Calculate Taxes" to see your tax breakdown
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-12 bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            Comprehensive Tax Processing Features
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <MapPin className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">All 50 States + DC</h3>
              <p className="text-gray-600 text-sm">
                Complete tax data for all US states and the District of Columbia, including states with no income tax
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Calculator className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Accurate Calculations</h3>
              <p className="text-gray-600 text-sm">
                Progressive tax brackets, flat rates, Social Security wage base limits, and Medicare thresholds
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <FileText className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Multiple Filing Status</h3>
              <p className="text-gray-600 text-sm">
                Support for Single, Married Filing Jointly/Separately, and Head of Household filing statuses
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailySpecialPage;