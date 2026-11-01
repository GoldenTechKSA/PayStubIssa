import { describe, it, expect, jest } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { StubPager } from '../components/wizard/StubPager';

const stubs = [
  { periodStart: '2025-09-28', periodEnd: '2025-10-11', payDate: '2025-10-12' },
  { periodStart: '2025-10-12', periodEnd: '2025-10-25', payDate: '2025-10-26' },
  { periodStart: '2025-10-26', periodEnd: '2025-11-08', payDate: '2025-11-09' },
];

describe('StubPager', () => {
  it('renders nothing for a single stub', () => {
    const { container } = render(<StubPager count={1} active={0} onChange={() => {}} stubs={stubs.slice(0, 1)} />);
    expect(container.innerHTML).toBe('');
  });

  it('names the active stub and its dates', () => {
    render(<StubPager count={3} active={1} onChange={() => {}} stubs={stubs} />);
    expect(screen.getByText(/pay stub 2 of 3/i)).toBeTruthy();
    expect(screen.getByText(/10\/12\/2025 – 10\/25\/2025/)).toBeTruthy();
    expect(screen.getByText(/pay date 10\/26\/2025/i)).toBeTruthy();
  });

  it('disables the arrow at either end of the run', () => {
    const { rerender } = render(<StubPager count={3} active={0} onChange={() => {}} stubs={stubs} />);
    expect((screen.getByRole('button', { name: /previous pay stub/i }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: /next pay stub/i }) as HTMLButtonElement).disabled).toBe(false);
    rerender(<StubPager count={3} active={2} onChange={() => {}} stubs={stubs} />);
    expect((screen.getByRole('button', { name: /previous pay stub/i }) as HTMLButtonElement).disabled).toBe(false);
    expect((screen.getByRole('button', { name: /next pay stub/i }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('arrows step one stub at a time', () => {
    const onChange = jest.fn();
    render(<StubPager count={3} active={1} onChange={onChange} stubs={stubs} />);
    fireEvent.click(screen.getByRole('button', { name: /next pay stub/i }));
    expect(onChange).toHaveBeenLastCalledWith(2);
    fireEvent.click(screen.getByRole('button', { name: /previous pay stub/i }));
    expect(onChange).toHaveBeenLastCalledWith(0);
  });

  it('dots jump straight to a stub and mark the current one', () => {
    const onChange = jest.fn();
    render(<StubPager count={3} active={0} onChange={onChange} stubs={stubs} />);
    fireEvent.click(screen.getByRole('button', { name: /^pay stub 3$/i }));
    expect(onChange).toHaveBeenLastCalledWith(2);
    expect(screen.getByRole('button', { name: /^pay stub 1$/i }).getAttribute('aria-current')).toBe('true');
    expect(screen.getByRole('button', { name: /^pay stub 2$/i }).getAttribute('aria-current')).toBeNull();
  });

  it('left and right arrow keys move through the run', () => {
    const onChange = jest.fn();
    render(<StubPager count={3} active={1} onChange={onChange} stubs={stubs} />);
    const group = screen.getByRole('group', { name: /pay stubs in this run/i });
    fireEvent.keyDown(group, { key: 'ArrowRight' });
    expect(onChange).toHaveBeenLastCalledWith(2);
    fireEvent.keyDown(group, { key: 'ArrowLeft' });
    expect(onChange).toHaveBeenLastCalledWith(0);
  });
});
