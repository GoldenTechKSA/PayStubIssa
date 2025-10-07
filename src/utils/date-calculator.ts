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
