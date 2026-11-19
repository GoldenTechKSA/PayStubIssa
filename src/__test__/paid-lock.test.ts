import { createAppStore } from 'redux/store';
import { prodInitialState } from 'assets/data/production-initial-state';
import { PayStubDetails } from 'assets/data/pay-stub-details';
import { saveCompanyInfo, saveEmployeeInfo, saveGeneralInfo, saveIncomeDetails, updateAppSettings } from 'redux/actions';
import { contentOf, fingerprintOf, lockStatus, newSalt } from 'utils/paid-lock';
import { Unlock } from 'services/payments-api';

const SALT = '00112233445566778899aabbccddeeff';

/** A realistic three-stub run, built from the production seed. */
function makeState(): PayStubDetails {
  const s: any = JSON.parse(JSON.stringify(prodInitialState));
  s.appSettings.configPath = '/configs/template-simple/paystub-config.xml';
  s.appSettings.templateId = 0;
  Object.assign(s.companyInfo, {
    companyName: 'Acme Widgets LLC', companyEIN: '12-3456789', companyAddress1: '1 Main St',
    companyCity: 'Seattle', companyState: 'Washington', companyZipCode: '98101',
  });
  Object.assign(s.employeeInfo, {
    employeeFirstName: 'Jane', employeeLastName: 'Doe', employeeSSN: '123-45-6789',
    employeeState: 'Washington', employeeMarriedStatus: 'single',
  });
  Object.assign(s.incomeDetails, {
    wageType: 'Hourly', hourlyRate: 30, hoursWorked: 40, overtimeRate: 45, overtimeHours: 2,
    bonusAmount: 0, deduction401k: 0.05, periodStartDate: '2026-11-01', periodEndDate: '2026-11-07',
    periodPayDate: '2026-11-14', periodType: 'Weekly',
    stubOverrides: [{}, { hoursWorked: 38 }, { hourlyRate: 29, overtimeHours: 1 }],
  });
  Object.assign(s.generalInfo, { payStubCount: 3, checkNumber: 5001, payStubNumber: 12, extraNotes: 'note' });
  return s as PayStubDetails;
}

const fp = (s: PayStubDetails, salt = SALT) => fingerprintOf(contentOf(s), salt);

const unlockFor = (s: PayStubDetails, qty = 3): Unlock => ({
  token: 't', orderId: 'o', expiresAt: '2099-01-01T00:00:00Z', qty,
  fingerprint: fp(s), salt: SALT, snapshot: contentOf(s),
});

describe('paid-lock fingerprint', () => {
  it('is stable across a draft save and reload', () => {
    const fill = (store: ReturnType<typeof createAppStore>, d: any) => {
      store.dispatch(updateAppSettings({ configPath: '/configs/template-simple/paystub-config.xml', templateId: 0 }));
      store.dispatch(saveCompanyInfo(d.companyInfo));
      store.dispatch(saveEmployeeInfo(d.employeeInfo));
      store.dispatch(saveIncomeDetails(d.incomeDetails));
      store.dispatch(saveGeneralInfo(d.generalInfo));
    };
    const source: any = makeState();
    // Real Date objects in the live state, as the wizard steps produce them.
    source.incomeDetails.periodPayDate = new Date('2026-11-14T00:00:00');
    source.employeeInfo.employeeHireDate = new Date('2025-01-01');
    const original = createAppStore(JSON.parse(JSON.stringify(prodInitialState)));
    fill(original, source);

    const o = original.getState() as PayStubDetails;
    const draft = JSON.parse(JSON.stringify({
      companyInfo: o.companyInfo, employeeInfo: o.employeeInfo, incomeDetails: o.incomeDetails, generalInfo: o.generalInfo,
    }));
    const reloadedStore = createAppStore(JSON.parse(JSON.stringify(prodInitialState)));
    fill(reloadedStore, draft);

    expect(fp(reloadedStore.getState() as PayStubDetails)).toBe(fp(o));
  });

  it.each<[string, (s: any) => void]>([
    ['an employee name', s => { s.employeeInfo.employeeFirstName = 'Jon'; }],
    ['an hourly rate', s => { s.incomeDetails.hourlyRate = 31; }],
    ['a pay date', s => { s.incomeDetails.periodPayDate = '2026-11-20'; }],
    ['the stub count', s => { s.generalInfo.payStubCount = 4; }],
    ['a per-stub override', s => { s.incomeDetails.stubOverrides[1] = { bonus: 100 }; }],
    ['the template', s => { s.appSettings.configPath = '/configs/template-modern/paystub-config.xml'; }],
  ])('changes when %s changes', (_n, mutate) => {
    const s = makeState();
    const before = fp(s);
    mutate(s);
    expect(fp(s)).not.toBe(before);
  });

  it('ignores the internal notes', () => {
    const s = makeState();
    const before = fp(s);
    s.generalInfo.extraNotes = 'something else entirely';
    expect(fp(s)).toBe(before);
    expect((contentOf(s).generalInfo as any).extraNotes).toBeUndefined();
  });

  it('treats a cleared field and a missing field alike', () => {
    const a: any = makeState();
    const b: any = makeState();
    const c: any = makeState();
    a.companyInfo.companyAddress2 = '';
    b.companyInfo.companyAddress2 = undefined;
    delete c.companyInfo.companyAddress2;
    expect(fp(a)).toBe(fp(c));
    expect(fp(b)).toBe(fp(c));
    const d: any = makeState();
    d.companyInfo.companyAddress2 = null;
    expect(fp(d)).toBe(fp(c));
  });

  it('treats the stub count as a number whether it is stored as text or not', () => {
    const a: any = makeState();
    const b: any = makeState();
    a.generalInfo.payStubCount = '3';
    b.generalInfo.payStubCount = 3;
    expect(fp(a)).toBe(fp(b));
  });

  it('treats trailing empty stub overrides as absent', () => {
    const withOverrides = (o?: any[]) => {
      const s: any = makeState();
      if (o === undefined) delete s.incomeDetails.stubOverrides;
      else s.incomeDetails.stubOverrides = o;
      return fp(s);
    };
    expect(withOverrides([{}])).toBe(withOverrides([]));
    expect(withOverrides([])).toBe(withOverrides(undefined));
    expect(withOverrides([{}, {}, {}])).toBe(withOverrides(undefined));
    expect(withOverrides([{ bonusAmount: 100 }, {}])).toBe(withOverrides([{ bonusAmount: 100 }]));
  });

  it('keeps the position of an override', () => {
    const withOverrides = (o: any[]) => {
      const s: any = makeState();
      s.incomeDetails.stubOverrides = o;
      return fp(s);
    };
    expect(withOverrides([{}, { bonusAmount: 100 }])).not.toBe(withOverrides([{ bonusAmount: 100 }]));
  });

  it('is independent of key order', () => {
    const a = makeState();
    const b: any = makeState();
    b.employeeInfo = Object.fromEntries(Object.entries(b.employeeInfo).reverse());
    b.incomeDetails = Object.fromEntries(Object.entries(b.incomeDetails).reverse());
    expect(fp(b)).toBe(fp(a));
  });

  it('differs with a different salt', () => {
    const s = makeState();
    expect(fp(s, SALT)).not.toBe(fp(s, 'ffeeddccbbaa99887766554433221100'));
  });

  it('is 64 lower-case hex characters, and a salt is 32', () => {
    expect(fp(makeState())).toMatch(/^[0-9a-f]{64}$/);
    const salt = newSalt();
    expect(salt).toMatch(/^[0-9a-f]{32}$/);
    expect(newSalt()).not.toBe(salt);
  });
});

describe('lockStatus', () => {
  it('is unpaid without an unlock, match when nothing changed, mismatch after an edit', () => {
    const s = makeState();
    expect(lockStatus(s, undefined)).toBe('unpaid');
    const unlock = unlockFor(s);
    expect(lockStatus(s, unlock)).toBe('match');
    s.employeeInfo.employeeLastName = 'Smith';
    expect(lockStatus(s, unlock)).toBe('mismatch');
  });

  it('stays a match when only the internal notes change', () => {
    const s = makeState();
    const unlock = unlockFor(s);
    s.generalInfo.extraNotes = 'edited after paying';
    expect(lockStatus(s, unlock)).toBe('match');
  });

  it('follows the quantity rule for an unlock with no fingerprint', () => {
    const s = makeState();
    const old: Unlock = { token: 't', orderId: 'o', expiresAt: '2099-01-01T00:00:00Z', qty: 3 };
    expect(lockStatus(s, old)).toBe('match');
    s.employeeInfo.employeeFirstName = 'Anyone';
    expect(lockStatus(s, old)).toBe('match');
    s.generalInfo.payStubCount = 4;
    expect(lockStatus(s, old)).toBe('mismatch');
  });

  it('a fingerprint without a salt is a mismatch', () => {
    const s = makeState();
    const { salt, ...noSalt } = unlockFor(s);
    expect(lockStatus(s, noSalt as Unlock)).toBe('mismatch');
  });

  it('is a mismatch when the count exceeds the paid quantity', () => {
    const s = makeState();
    const unlock = unlockFor(s, 2);
    expect(lockStatus(s, unlock)).toBe('mismatch');
  });
});
