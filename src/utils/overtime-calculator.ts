// Overtime pay for a period = rate * hours (0 when no rate is set).
export const calculateOvertime = (rate: number, hours: number): number => {
  return rate ? rate * hours : 0;
};

// The Fair Labor Standards Act (29 U.S.C. § 207) sets overtime at no less than one and a half
// times the regular rate. It is a floor: an employer may pay more (double time, for example).
export const OVERTIME_MULTIPLIER = 1.5;

// The lowest overtime rate allowed for an hourly rate, in dollars and whole cents. Rounded up,
// because a rate a fraction of a cent short of 1.5× is still short (15.33 an hour → 23.00, not 22.99).
export const minOvertimeRate = (hourlyRate: number): number => {
  if (!(hourlyRate > 0)) return 0;
  return Math.ceil(hourlyRate * OVERTIME_MULTIPLIER * 100 - 1e-6) / 100;
};

// True when the overtime entries break the floor: a rate below 1.5× the hourly rate, or overtime
// hours with no rate at all. No overtime (no rate and no hours) is fine.
export const overtimeRateTooLow = (hourlyRate: number, overtimeRate: number, overtimeHours: number): boolean => {
  if (!(overtimeRate > 0) && !(overtimeHours > 0)) return false;
  return !(overtimeRate > 0) || overtimeRate < minOvertimeRate(hourlyRate);
};
