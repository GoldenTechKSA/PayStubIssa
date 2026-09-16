// 'YYYY-MM-DD' read as a LOCAL calendar date. `new Date('2021-06-16')` is UTC midnight,
// which is the PREVIOUS day everywhere west of Greenwich — enough to shift every printed
// period by a day and, for Semi-Monthly, to put the start in the wrong half of the month
// and collapse the period to a single day.
const parseLocalDate = (value: unknown): Date => {
    const raw = String(value ?? '');
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
    return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(raw);
};

// The matching serializer: local getters, so a date never crosses midnight on the way out.
const formatLocalDate = (d: Date): string =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Function to calculate end date based on period type and start date
export const calculateEndDate = (startDate, payPeriodType) => {
    if (!startDate || !payPeriodType) return "";

    const start = parseLocalDate(startDate);

    switch(payPeriodType) {
        case "Weekly":
            const weeklyEnd = new Date(start);
            weeklyEnd.setDate(start.getDate() + 6); // 7 days total (start date inclusive)
            return formatLocalDate(weeklyEnd);
        case "Bi-Weekly":
            const biWeeklyEnd = new Date(start);
            biWeeklyEnd.setDate(start.getDate() + 13); // 14 days total (start date inclusive)
            return formatLocalDate(biWeeklyEnd);
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
            return formatLocalDate(semiMonthlyEnd);
        case "Monthly":
            const monthlyEnd = new Date(start);
            monthlyEnd.setMonth(start.getMonth() + 1);
            monthlyEnd.setDate(0); // Last day of the month
            return formatLocalDate(monthlyEnd);
        case "Quarterly":
            const quarterlyEnd = new Date(start);
            quarterlyEnd.setMonth(start.getMonth() + 3);
            quarterlyEnd.setDate(0); // Last day of the quarter month
            return formatLocalDate(quarterlyEnd);
        case "Semiannually":
            const semiannualEnd = new Date(start);
            semiannualEnd.setMonth(start.getMonth() + 6);
            semiannualEnd.setDate(0); // Last day of the 6-month period
            return formatLocalDate(semiannualEnd);
        case "Annually":
            const annualEnd = new Date(start);
            annualEnd.setFullYear(start.getFullYear() + 1);
            annualEnd.setDate(0); // Last day of the year
            return formatLocalDate(annualEnd);
        default:
            return "";
    }
};

// Function to calculate pay date (end date + 1 day)
export const calculatePayDate = (endDate) => {
    if (!endDate) return "";

    const end = parseLocalDate(endDate);
    end.setDate(end.getDate() + 1);
    return formatLocalDate(end);
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

// Normalize a date value to a `YYYY-MM-DD` string, or '' if it isn't a usable date.
//
// The store types these fields as `Date`, but the wizard's date inputs actually put
// `YYYY-MM-DD` strings there, and tests construct real Dates. Both have to work, and
// `String(someDate).slice(0, 10)` does NOT — it yields "Wed Jan 01".
export const toISODate = (value: unknown): string => {
    if (!value) return '';

    if (value instanceof Date) {
        if (Number.isNaN(value.getTime())) return '';

        // A Date sitting exactly on UTC midnight came from a date-only string
        // (`new Date('2025-01-01')`), so it must be read back in UTC — reading it with local
        // getters lands on the previous day everywhere west of Greenwich. Anything else was
        // built from local parts (`new Date()`, `new Date(2025, 0, 1)`) and reads as local.
        const isUtcMidnight = value.getUTCHours() === 0
            && value.getUTCMinutes() === 0
            && value.getUTCSeconds() === 0
            && value.getUTCMilliseconds() === 0;

        if (isUtcMidnight) return value.toISOString().slice(0, 10);

        const year = value.getFullYear();
        const month = String(value.getMonth() + 1).padStart(2, '0');
        const day = String(value.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    const raw = String(value);
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);

    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? '' : toISODate(parsed);
};

// Number of pay periods elapsed in `asOf`'s calendar year, as of `asOf`. Used as the YTD
// multiplier (current-period amount * periods elapsed). Always at least 1, capped at a full year.
// This is a simple proportional estimate, not a true payroll-history accumulation.
//
// Takes the date explicitly so that each stub in a multi-stub run computes YTD against its OWN
// pay date — that is what makes YTD grow correctly from one stub to the next.
export const periodsElapsedAt = (periodType: string, asOf: unknown): number => {
    const perYear = periodsPerYear(periodType);

    const iso = toISODate(asOf);
    // An unusable date (mid-wizard, nothing entered yet) falls back to today.
    const date = iso ? new Date(`${iso}T00:00:00Z`) : new Date();

    const startOfYear = Date.UTC(date.getUTCFullYear(), 0, 1);
    const days = Math.floor((date.getTime() - startOfYear) / (24 * 60 * 60 * 1000));
    const fractionElapsed = (days + 1) / 365;
    return Math.min(perYear, Math.max(1, Math.ceil(fractionElapsed * perYear)));
};

// Periods elapsed so far this year, as of today. Thin wrapper kept for existing callers.
export const periodsToDateThisYear = (periodType: string): number =>
    periodsElapsedAt(periodType, new Date());

export interface PayPeriod {
    startDate: string; // YYYY-MM-DD
    endDate: string;
    payDate: string;
}

// Expand a starting date into `count` CONSECUTIVE pay periods of the given frequency.
// Each period begins the day after the previous one ended, so the run is gapless.
//
// The date the user enters is period #1; the run advances forward from there. That matches the
// rest of the form, where the check number and pay stub number are both "starting" values that
// increment across the run.
export const buildPayPeriods = (startDate: unknown, periodType: string, count: number): PayPeriod[] => {
    const periods: PayPeriod[] = [];

    let currentStart = toISODate(startDate);
    if (!currentStart || !periodType) return periods;

    const total = Math.max(1, Math.floor(count) || 1);

    for (let i = 0; i < total; i++) {
        const endDate = calculateEndDate(currentStart, periodType);
        if (!endDate) break;

        periods.push({ startDate: currentStart, endDate, payDate: calculatePayDate(endDate) });

        // The next period starts the day after this one ends. Step in UTC so the run can't
        // drift a day in timezones behind GMT.
        const nextStart = new Date(`${endDate}T00:00:00Z`);
        nextStart.setUTCDate(nextStart.getUTCDate() + 1);
        currentStart = nextStart.toISOString().slice(0, 10);
    }

    return periods;
};
