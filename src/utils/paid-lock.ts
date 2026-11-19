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
function canonical(value: any): string {
  if (Array.isArray(value)) return `[${value.map(v => (v === undefined ? 'null' : canonical(v))).join(',')}]`;
  if (value && typeof value === 'object') {
    const parts = Object.keys(value).sort()
      .filter(k => value[k] !== null && value[k] !== undefined && value[k] !== '')
      .map(k => `${JSON.stringify(k)}:${canonical(value[k])}`);
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
  if (unlock.fingerprint && unlock.salt) {
    return covered && fingerprintOf(contentOf(state), unlock.salt) === unlock.fingerprint ? 'match' : 'mismatch';
  }
  return covered ? 'match' : 'mismatch';
}
