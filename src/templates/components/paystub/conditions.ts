import { PaystubModel } from 'assets/data/pay-stub-details';

/**
 * Evaluates a `renderIf` expression against the data model.
 *
 * `renderIf` is an optional attribute on <section>/<column>/<table>. Its value is a
 * dotted path into the PaystubModel (e.g. "totalDeductions"). The element renders
 * only when that path resolves to a "present" value:
 *   - number  -> non-zero (and not NaN)
 *   - string  -> non-empty; if numeric, non-zero
 *   - boolean -> true
 *   - null/undefined/missing -> false
 *
 * A leading "!" negates the test (e.g. renderIf="!totalDeductions" renders only when
 * there are NO deductions). No expression (undefined/empty) always renders. This lets a
 * template drop a block the user never filled in — e.g. an all-zero deductions table.
 */
export const evalRenderIf = (expr: string | undefined, data: PaystubModel): boolean => {
  if (!expr || !expr.trim()) return true;

  let path = expr.trim();
  let negate = false;
  if (path.startsWith('!')) { negate = true; path = path.slice(1).trim(); }
  if (!path) return true;

  let value: unknown = data;
  for (const key of path.split('.')) {
    if (value == null || typeof value !== 'object') { value = undefined; break; }
    value = (value as Record<string, unknown>)[key];
  }

  let truthy: boolean;
  if (value == null) truthy = false;
  else if (typeof value === 'number') truthy = value !== 0 && !Number.isNaN(value);
  else if (typeof value === 'boolean') truthy = value;
  else if (typeof value === 'string') {
    const t = value.trim();
    truthy = t === '' ? false : (Number.isNaN(Number(t)) ? true : Number(t) !== 0);
  } else truthy = true;

  return negate ? !truthy : truthy;
};
