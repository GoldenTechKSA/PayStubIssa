import { describe, it, expect, beforeEach } from '@jest/globals';
import React from 'react';
import { useLocation } from 'react-router-dom';
import { screen } from '@testing-library/react';
import { renderWithApp } from './test-utils';
import PaystubWizard from '../components/wizard/PaystubWizard';

const DRAFT_KEY = 'paystubissa.draft.v1';

/** Shows where the router is, so a test can see the `stubs` parameter being consumed. */
const Where = () => {
  const { pathname, search } = useLocation();
  return <div data-testid="where">{pathname}{search}</div>;
};
const where = () => screen.getByTestId('where').textContent;

const open = (route: string) => renderWithApp(<><PaystubWizard /><Where /></>, { route });
const saveDraft = (generalInfo: object, companyName = 'Acme Tools') =>
  localStorage.setItem(DRAFT_KEY, JSON.stringify({ companyInfo: { companyName }, generalInfo }));

beforeEach(() => {
  localStorage.clear();
  window.scrollTo = (() => {}) as any;
});

describe('wizard — stub count preset from an Offers card (?stubs=N)', () => {
  it('sets the number of pay stubs and drops the parameter from the address', () => {
    const { store } = open('/create?stubs=5');
    expect(store.getState().generalInfo.payStubCount).toBe(5);
    expect(where()).toBe('/create');
  });

  it('overrides only the count of a saved draft; everything else in the draft is kept', () => {
    saveDraft({ payStubCount: 3, checkNumber: '1042' });
    const { store } = open('/create?stubs=9');
    const state = store.getState();
    expect(state.generalInfo.payStubCount).toBe(9);
    expect(state.generalInfo.checkNumber).toBe('1042');
    expect(state.companyInfo.companyName).toBe('Acme Tools');
  });

  it('clamps a count above the order limit', () => {
    const { store } = open('/create?stubs=99');
    expect(store.getState().generalInfo.payStubCount).toBe(12);
  });

  it.each(['0', '-3', 'abc', '', '2.5'])('ignores stubs=%s and leaves the saved count alone', (value) => {
    saveDraft({ payStubCount: 3 });
    const { store } = open(`/create?stubs=${value}`);
    expect(store.getState().generalInfo.payStubCount).toBe(3);
    expect(where()).toBe('/create');
  });

  it('leaves the count alone when there is no parameter', () => {
    saveDraft({ payStubCount: 4 });
    const { store } = open('/create');
    expect(store.getState().generalInfo.payStubCount).toBe(4);
  });

  it('keeps other parameters on the address', () => {
    open('/create?stubs=2&ref=offers');
    expect(where()).toBe('/create?ref=offers');
  });
});
