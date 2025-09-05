import { FilingStatus } from "types/tax-rate-types";

// Helper to format date fields safely
export const formatDate = (date: Date | string | undefined | null) => {
  if (!date) return "";
  if (typeof date === "string") return date;
  if (date instanceof Date && !isNaN(date.getTime())) return date.toLocaleDateString();
  return String(date);
};

export const getWeeksToDateThisYear = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1); // January 1st
  // Calculate the number of days between Jan 1 and today
  const days = Math.floor((now.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  // Calculate the week number (ISO weeks start on Monday, but this is a simple calculation)
  return Math.ceil((days + 1) / 7);
};

// Helper function to format currency
export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

interface TaxResult {
    taxAmount: number;
    effectiveRate: number;
    marginalRate: number;
    afterTaxIncome: number;
}

// type FilingStatus = 'single' | 'married_joint' | 'married_separate' | 'head_of_household' | 'qualifying_widower';

interface TaxBracket {
    threshold: number;
    rate: number;
}

interface TaxBrackets {
    single: TaxBracket[];
    married_joint: TaxBracket[];
    married_separate: TaxBracket[];
    head_of_household: TaxBracket[];
}

export const calculateFederalIncomeTax2025 = (income: number, filingStatus: FilingStatus): TaxResult => {
    // Projected 2025 tax brackets (estimated based on 2024 brackets + 2.5% inflation)
    const taxBrackets: TaxBrackets = {
        single: [
            { threshold: 0, rate: 0.10 },
            { threshold: 11600, rate: 0.12 },
            { threshold: 47150, rate: 0.22 },
            { threshold: 100525, rate: 0.24 },
            { threshold: 191950, rate: 0.32 },
            { threshold: 243725, rate: 0.35 },
            { threshold: 609350, rate: 0.37 }
        ],
        married_joint: [
            { threshold: 0, rate: 0.10 },
            { threshold: 23200, rate: 0.12 },
            { threshold: 94300, rate: 0.22 },
            { threshold: 201050, rate: 0.24 },
            { threshold: 383900, rate: 0.32 },
            { threshold: 487450, rate: 0.35 },
            { threshold: 731200, rate: 0.37 }
        ],
        married_separate: [
            { threshold: 0, rate: 0.10 },
            { threshold: 11600, rate: 0.12 },
            { threshold: 47150, rate: 0.22 },
            { threshold: 100525, rate: 0.24 },
            { threshold: 191950, rate: 0.32 },
            { threshold: 243725, rate: 0.35 },
            { threshold: 365600, rate: 0.37 }
        ],
        head_of_household: [
            { threshold: 0, rate: 0.10 },
            { threshold: 16550, rate: 0.12 },
            { threshold: 63100, rate: 0.22 },
            { threshold: 100500, rate: 0.24 },
            { threshold: 191950, rate: 0.32 },
            { threshold: 243700, rate: 0.35 },
            { threshold: 609350, rate: 0.37 }
        ]
    };

    if (!(filingStatus in taxBrackets)) {
        throw new Error("Invalid filing status. Choose from: 'single', 'married_joint', 'married_separate', 'head_of_household' | 'qualifying_widower'");
    }

    if (income < 0) {
        throw new Error("Income cannot be negative");
    }

    const brackets = taxBrackets[filingStatus];
    let tax = 0;
    let remainingIncome = income;

    // Calculate tax using progressive tax system
    for (let i = 0; i < brackets.length; i++) {
        const currentBracket = brackets[i];
        const nextBracket = brackets[i + 1];

        if (remainingIncome <= 0) break;

        if (!nextBracket) {
            // Highest bracket - tax everything above this threshold
            if (remainingIncome > currentBracket.threshold) {
                tax += (remainingIncome - currentBracket.threshold) * currentBracket.rate;
            }
            break;
        }

        if (remainingIncome > currentBracket.threshold) {
            const taxableInThisBracket = Math.min(
                remainingIncome - currentBracket.threshold,
                nextBracket.threshold - currentBracket.threshold
            );
            
            if (taxableInThisBracket > 0) {
                tax += taxableInThisBracket * currentBracket.rate;
            }
        }
    }

    // Calculate effective and marginal tax rates
    const effectiveRate = income > 0 ? (tax / income) * 100 : 0;

    // Find marginal tax rate
    let marginalRate = 0;
    for (let i = brackets.length - 1; i >= 0; i--) {
        if (income > brackets[i].threshold) {
            marginalRate = brackets[i].rate;
            break;
        }
    }

    return {
        taxAmount: Math.round(tax * 100) / 100,
        effectiveRate: Math.round(effectiveRate * 100) / 100,
        marginalRate: marginalRate,
        afterTaxIncome: Math.round((income - tax) * 100) / 100
    };
}

interface FICAResult {
    socialSecurityTax: number;
    medicareTax: number;
    totalFICATax: number;
    employerMatch: number;
    totalFICAContribution: number;
    netIncomeAfterFICA: number;
}

interface FICALimits {
    socialSecurityWageBase: number;
    socialSecurityRate: number;
    medicareStandardRate: number;
    medicareAdditionalRate: number;
    additionalMedicareThreshold: number;
}

class FICATaxCalculator {
    // 2025 FICA tax limits and rates (estimated - adjust when official numbers are released)
    private static readonly DEFAULT_LIMITS_2025: FICALimits = {
        socialSecurityWageBase: 175000,    // Estimated for 2025 (was $168,600 in 2024)
        socialSecurityRate: 0.062,         // 6.2% for employee
        medicareStandardRate: 0.0145,      // 1.45% for employee
        medicareAdditionalRate: 0.009,     // 0.9% additional Medicare tax
        additionalMedicareThreshold: 200000 // Single filers threshold (est. $200,000)
    };

    static calculateFICA(
        income: number, 
        filingStatus?: 'single' | 'married_joint' | 'married_separate' | 'head_of_household',
        customLimits?: Partial<FICALimits>
    ): FICAResult {
        if (income < 0) {
            throw new Error("Income cannot be negative");
        }

        const limits = { ...this.DEFAULT_LIMITS_2025, ...customLimits };
        const medicareThreshold = this.getMedicareThreshold(filingStatus, limits.additionalMedicareThreshold);

        // Calculate Social Security Tax (capped at wage base)
        const socialSecurityTaxable = Math.min(income, limits.socialSecurityWageBase);
        const socialSecurityTax = socialSecurityTaxable * limits.socialSecurityRate;

        // Calculate Medicare Tax
        let medicareTax = 0;
        
        // Standard Medicare tax (applies to all income)
        medicareTax += income * limits.medicareStandardRate;
        
        // Additional Medicare tax (applies to income above threshold)
        if (income > medicareThreshold) {
            const additionalMedicareTaxable = income - medicareThreshold;
            medicareTax += additionalMedicareTaxable * limits.medicareAdditionalRate;
        }

        const totalFICATax = socialSecurityTax + medicareTax;
        const employerMatch = totalFICATax; // Employer matches employee FICA contributions
        const totalFICAContribution = totalFICATax + employerMatch;

        return {
            socialSecurityTax: Math.round(socialSecurityTax * 100) / 100,
            medicareTax: Math.round(medicareTax * 100) / 100,
            totalFICATax: Math.round(totalFICATax * 100) / 100,
            employerMatch: Math.round(employerMatch * 100) / 100,
            totalFICAContribution: Math.round(totalFICAContribution * 100) / 100,
            netIncomeAfterFICA: Math.round((income - totalFICATax) * 100) / 100
        };
    }

    private static getMedicareThreshold(
        filingStatus?: string, 
        baseThreshold: number = 200000
    ): number {
        if (!filingStatus) return baseThreshold;

        switch (filingStatus) {
            case 'married_joint':
                return 250000; // Higher threshold for married filing jointly
            case 'married_separate':
                return 125000; // Lower threshold for married filing separately
            case 'head_of_household':
                return 200000; // Same as single for head of household
            case 'single':
            default:
                return baseThreshold;
        }
    }

    // Method to calculate FICA for self-employed individuals (who pay both employee and employer portions)
    static calculateSelfEmployedFICA(
        income: number,
        filingStatus?: 'single' | 'married_joint' | 'married_separate' | 'head_of_household'
    ): FICAResult {
        if (income < 400) { // Self-employment tax generally doesn't apply to net earnings < $400
            return {
                socialSecurityTax: 0,
                medicareTax: 0,
                totalFICATax: 0,
                employerMatch: 0,
                totalFICAContribution: 0,
                netIncomeAfterFICA: income
            };
        }

        // Self-employed pay both employee and employer portions (92.35% of net earnings is subject to SE tax)
        const subjectToSETax = income * 0.9235;
        
        // Calculate as if employee portion, then double it for self-employment tax
        const employeePortion = this.calculateFICA(subjectToSETax, filingStatus);
        
        const selfEmploymentTax = employeePortion.totalFICATax * 2;
        
        // For self-employed, half of SE tax is deductible on income tax
        return {
            socialSecurityTax: Math.round(employeePortion.socialSecurityTax * 2 * 100) / 100,
            medicareTax: Math.round(employeePortion.medicareTax * 2 * 100) / 100,
            totalFICATax: Math.round(selfEmploymentTax * 100) / 100,
            employerMatch: 0, // Not applicable for self-employed in the same way
            totalFICAContribution: Math.round(selfEmploymentTax * 100) / 100,
            netIncomeAfterFICA: Math.round((income - selfEmploymentTax) * 100) / 100
        };
    }

    // Utility method to get current FICA limits
    static getFICALimits(): FICALimits {
        return { ...this.DEFAULT_LIMITS_2025 };
    }
}

// Function to display FICA tax results
function displayFICAResults(income: number, filingStatus?: string, isSelfEmployed: boolean = false): void {
    try {
        let result: FICAResult;
        let title: string;

        if (isSelfEmployed) {
            result = FICATaxCalculator.calculateSelfEmployedFICA(income, filingStatus as any);
            title = 'Self-Employed FICA Tax Calculation';
        } else {
            result = FICATaxCalculator.calculateFICA(income, filingStatus as any);
            title = 'Employee FICA Tax Calculation';
        }

        console.log(`📊 ${title} for 2025`);
        console.log('=========================================');
        console.log(`Annual Income: ${formatCurrency(income)}`);
        console.log(`Filing Status: ${filingStatus || 'Not specified'}`);
        console.log('-----------------------------------------');
        console.log(`Social Security Tax (6.2%): ${formatCurrency(result.socialSecurityTax)}`);
        console.log(`Medicare Tax: ${formatCurrency(result.medicareTax)}`);
        console.log(`Total FICA Tax: ${formatCurrency(result.totalFICATax)}`);
        
        if (!isSelfEmployed) {
            console.log(`Employer Match: ${formatCurrency(result.employerMatch)}`);
            console.log(`Total FICA Contribution: ${formatCurrency(result.totalFICAContribution)}`);
        } else {
            console.log(`Self-Employment Tax: ${formatCurrency(result.totalFICATax)}`);
        }
        
        console.log(`Net Income After FICA: ${formatCurrency(result.netIncomeAfterFICA)}`);
        console.log('=========================================\n');
    } catch (error) {
        console.error('Error:', (error as Error).message);
    }
}

// Example usage and test cases
console.log('FICA Tax Calculation Examples:\n');

// Regular employee examples
displayFICAResults(50000, 'single');
displayFICAResults(200000, 'single');
displayFICAResults(300000, 'married_joint');

// High income example (hits Social Security cap and Additional Medicare tax)
displayFICAResults(250000, 'single');

// Self-employed examples
displayFICAResults(80000, 'single', true);
displayFICAResults(150000, 'married_joint', true);

// Get current FICA limits
const limits = FICATaxCalculator.getFICALimits();
console.log('📋 2025 FICA Tax Limits (Estimated):');
console.log(`Social Security Wage Base: ${formatCurrency(limits.socialSecurityWageBase)}`);
console.log(`Social Security Rate: ${(limits.socialSecurityRate * 100).toFixed(2)}%`);
console.log(`Medicare Standard Rate: ${(limits.medicareStandardRate * 100).toFixed(2)}%`);
console.log(`Additional Medicare Rate: ${(limits.medicareAdditionalRate * 100).toFixed(2)}%`);
console.log(`Additional Medicare Threshold (Single): ${formatCurrency(limits.additionalMedicareThreshold)}\n`);

// Advanced usage with custom limits
const customLimits: Partial<FICALimits> = {
    socialSecurityWageBase: 180000, // Custom wage base
    medicareAdditionalRate: 0.0095  // Custom additional Medicare rate
};

const customResult = FICATaxCalculator.calculateFICA(220000, 'single', customLimits);
console.log('Custom limits calculation:', customResult);

export { FICATaxCalculator, type FICAResult, type FICALimits };