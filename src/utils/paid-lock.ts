/**
 * paid-lock
 * ---------
 * Fingerprint of everything that decides the printed pay stub, and the lock status that
 * follows from comparing it with what was paid for. Only the 64-hex fingerprint ever leaves
 * the browser; the salt and the content stay here.
 */

import { sha256 } from '@noble/hashes/sha256';
import { PayStubDetails } from 'assets/data/pay-stub-details';
import { normalizeStubCount } from 'constants/pricing';
import type { Unlock } from 'services/payments-api';

export interface PaidSnapshot {
  companyInfo: any; employeeInfo: any; incomeDetails: any; generalInfo: any;
  configPath: string; templateId: number | string;
}

/** Everything that decides the printed stub, in the form it is fingerprinted and stored. */
export function contentOf(state: PayStubDetails): PaidSnapshot {
  // The JSON round trip makes the live state and a snapshot kept in sessionStorage normalise
  // identically (Dates become strings, undefined keys vanish).
  const snapshot: PaidSnapshot = JSON.parse(JSON.stringify({
    companyInfo: state.companyInfo,
    employeeInfo: state.employeeInfo,
    incomeDetails: state.incomeDetails,
    generalInfo: state.generalInfo,
    configPath: state.appSettings?.configPath ?? '',
    templateId: state.appSettings?.templateId ?? 0,
  }));
  if (snapshot.generalInfo) delete snapshot.generalInfo.extraNotes;
  return snapshot;
}

/** JSON with keys sorted at every depth and empty values (null, undefined, '') left out. */
/**
 * "Empty" values mean the same as absent: null, undefined, '', an empty object, an empty array
 * (a missing per-stub override entry is read as no overrides). Trailing empty array entries are
 * dropped; empty entries in the middle stay, because the position in the run matters.
 */
const EMPTY = new Set(['null', '""', '{}', '[]']);

function canonical(value: any): string {
  if (value === null || value === undefined) return 'null';
  if (Array.isArray(value)) {
    const items = value.map(canonical);
    while (items.length && EMPTY.has(items[items.length - 1])) items.pop();
    return `[${items.join(',')}]`;
  }
  if (typeof value === 'object') {
    const parts = Object.keys(value).sort()
      .map(k => [k, canonical(value[k])] as const)
      .filter(([, c]) => !EMPTY.has(c))
      .map(([k, c]) => `${JSON.stringify(k)}:${c}`);
    return `{${parts.join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

const toHex = (bytes: Uint8Array): string => Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');

export function fingerprintOf(content: PaidSnapshot, salt: string): string {
  const normalised: PaidSnapshot = {
    ...content,
    generalInfo: { ...content.generalInfo, payStubCount: normalizeStubCount(content.generalInfo?.payStubCount) },
  };
  return toHex(sha256(new TextEncoder().encode(`${salt}\n${canonical(normalised)}`)));
}

/** 32 hex characters. It only has to be unguessable to the server, which never sees it. */
export function newSalt(): string {
  const bytes = new Uint8Array(16);
  const c: Crypto | undefined = (globalThis as any).crypto;
  if (c && typeof c.getRandomValues === 'function') c.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  return toHex(bytes);
}

export type LockStatus = 'unpaid' | 'match' | 'mismatch';

export function lockStatus(state: PayStubDetails, unlock: Unlock | undefined | null): LockStatus {
  if (!unlock) return 'unpaid';
  const covered = unlock.qty >= normalizeStubCount(state.generalInfo?.payStubCount);
  if (unlock.fingerprint) {
    // A fingerprint without its salt cannot be checked, so it never unlocks.
    if (!unlock.salt) return 'mismatch';
    return covered && fingerprintOf(contentOf(state), unlock.salt) === unlock.fingerprint ? 'match' : 'mismatch';
  }
  // No fingerprint at all: stored by an older build, the quantity rule applies.
  return covered ? 'match' : 'mismatch';
}

/**
 * The four slice payloads that put the stub back exactly as it was paid for. Reducers merge
 * their payload, so a key the paid content did not have is set to undefined here; otherwise a
 * field filled in after payment would survive the restore. `extraNotes` is not part of the
 * paid content and is left as it is.
 */
export function restorePayloads(state: PayStubDetails, snapshot: PaidSnapshot) {
  const replace = (current: any, paid: any, keep: string[] = []) => {
    const cleared: Record<string, undefined> = {};
    Object.keys(current || {}).forEach(k => { if (!keep.includes(k) && !(paid && k in paid)) cleared[k] = undefined; });
    return { ...cleared, ...(paid || {}) };
  };
  return {
    companyInfo: replace(state.companyInfo, snapshot.companyInfo),
    employeeInfo: replace(state.employeeInfo, snapshot.employeeInfo),
    incomeDetails: replace(state.incomeDetails, snapshot.incomeDetails),
    generalInfo: replace(state.generalInfo, snapshot.generalInfo, ['extraNotes']),
    template: { configPath: snapshot.configPath, templateId: snapshot.templateId },
  };
}
