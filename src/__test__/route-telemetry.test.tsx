import { test, expect, jest } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, Link } from 'react-router-dom';
import { RouteTelemetry } from '../components/common/route-telemetry';
import { telemetry } from '../services/telemetry-service';
import { T } from '../telemetry/codes';

test('emits page.viewed on navigation but not on first render', async () => {
  const emit = jest.spyOn(telemetry, 'emit').mockImplementation(() => {});
  render(
    <MemoryRouter initialEntries={['/']}>
      <RouteTelemetry />
      <Routes>
        <Route path="/" element={<Link to="/create">go</Link>} />
        <Route path="/create" element={<div>wizard</div>} />
      </Routes>
    </MemoryRouter>,
  );
  expect(emit).not.toHaveBeenCalled();
  await userEvent.click(screen.getByText('go'));
  expect(emit).toHaveBeenCalledWith(T.PAGE_VIEWED, { path: '/create' });
  emit.mockRestore();
});
