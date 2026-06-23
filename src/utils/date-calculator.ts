// Function to calculate end date based on period type and start date
export const calculateEndDate = (startDate, payPeriodType) => {
    if (!startDate || !payPeriodType) return "";

    const start = new Date(startDate);

    switch(payPeriodType) {
        case "Weekly":
            const weeklyEnd = new Date(start);
            weeklyEnd.setDate(start.getDate() + 6); // 7 days total (start date inclusive)
            return weeklyEnd.toISOString().split('T')[0];
        case "Bi-Weekly":
            const biWeeklyEnd = new Date(start);
            biWeeklyEnd.setDate(start.getDate() + 13); // 14 days total (start date inclusive)
            return biWeeklyEnd.toISOString().split('T')[0];
        case "Semi-Monthly":
            const semiMonthlyEnd = new Date(start);
            if (start.getDate() <= 15) {
                // First half of month - end on 15th
                semiMonthlyEnd.setDate(15);
            } else {
                // Second half of month - end on last day of month
                semiMonthlyEnd.setMonth(start.getMonth() + 1);
                semiMonthlyEnd.setDate(0);
            }
            return semiMonthlyEnd.toISOString().split('T')[0];
        case "Monthly":
            const monthlyEnd = new Date(start);
            monthlyEnd.setMonth(start.getMonth() + 1);
            monthlyEnd.setDate(0); // Last day of the month
            return monthlyEnd.toISOString().split('T')[0];
        case "Quarterly":
            const quarterlyEnd = new Date(start);
            quarterlyEnd.setMonth(start.getMonth() + 3);
            quarterlyEnd.setDate(0); // Last day of the quarter month
            return quarterlyEnd.toISOString().split('T')[0];
        case "Semiannually":
            const semiannualEnd = new Date(start);
            semiannualEnd.setMonth(start.getMonth() + 6);
            semiannualEnd.setDate(0); // Last day of the 6-month period
            return semiannualEnd.toISOString().split('T')[0];
        case "Annually":
            const annualEnd = new Date(start);
            annualEnd.setFullYear(start.getFullYear() + 1);
            annualEnd.setDate(0); // Last day of the year
            return annualEnd.toISOString().split('T')[0];
        default:
            return "";
    }
};

// Function to calculate pay date (end date + 1 day)
export const calculatePayDate = (endDate) => {
    if (!endDate) return "";

    const end = new Date(endDate);
    end.setDate(end.getDate() + 1);
    return end.toISOString().split('T')[0];
};

// Number of pay periods in a full year for a given period type.
// Keys match the periodType values used by calculateEndDate above.
export const periodsPerYear = (periodType: string): number => {
    switch (periodType) {
        case "Weekly": return 52;
        case "Bi-Weekly": return 26;
        case "Semi-Monthly": return 24;
        case "Monthly": return 12;
        case "Quarterly": return 4;
        case "Semiannually": return 2;
        case "Annually": return 1;
        default: return 52;
    }
};

// Number of pay periods elapsed so far this calendar year, used as the YTD multiplier
// (current-period amount * periodsToDateThisYear). Always at least 1, capped at a full year.
// This is a simple proportional estimate, not a true payroll-history accumulation.
export const periodsToDateThisYear = (periodType: string): number => {
    const perYear = periodsPerYear(periodType);
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const fractionElapsed = (days + 1) / 365;
    return Math.min(perYear, Math.max(1, Math.ceil(fractionElapsed * perYear)));
};
