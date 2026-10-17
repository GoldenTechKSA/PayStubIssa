import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithApp } from './test-utils';
import PaystubWizard from '../components/wizard/PaystubWizard';
import { telemetry } from '../services/telemetry-service';
import { T } from '../telemetry/codes';

describe('wizard telemetry', () => {
  let emit: ReturnType<typeof jest.spyOn>;
  beforeEach(() => {
    emit = jest.spyOn(telemetry, 'emit').mockImplementation(() => {});
    window.scrollTo = jest.fn() as any;
  });
  afterEach(() => emit.mockRestore());

  it('reports entering, viewing, completing and going back', async () => {
    const { unmount } = renderWithApp(<PaystubWizard />);
    expect(emit).toHaveBeenCalledWith(T.WIZARD_ENTERED, { draftRestored: false });
    expect(emit).toHaveBeenCalledWith(T.WIZARD_STEP_VIEWED, { step: 0, name: 'Company' });

    await userEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(emit).toHaveBeenCalledWith(T.WIZARD_STEP_COMPLETED, { step: 0, name: 'Company' });
    expect(emit).toHaveBeenCalledWith(T.WIZARD_STEP_VIEWED, { step: 1, name: 'Employee' });

    await userEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(emit).toHaveBeenCalledWith(T.WIZARD_STEP_BACK, { step: 1 });

    unmount();
    expect(emit).toHaveBeenCalledWith(T.WIZARD_EXITED, { lastStep: 0 });
  });

  it('reports a stepper jump', async () => {
    renderWithApp(<PaystubWizard />);
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));
    await userEvent.click(screen.getByText('Company'));
    expect(emit).toHaveBeenCalledWith(T.WIZARD_STEP_JUMPED, { from: 1, to: 0 });
  });
});
