// Overtime pay for a period = rate * hours (0 when no rate is set).
export const calculateOvertime = (rate: number, hours: number): number => {
  return rate ? rate * hours : 0;
};
