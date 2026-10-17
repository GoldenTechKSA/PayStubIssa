import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material';
import theme from '../theme/theme';
import { createAppStore } from '../redux/store';

/** Render a component inside the same Redux store, router and MUI theme the app uses. */
export function renderWithApp(ui: React.ReactElement, { route = '/create' } = {}) {
  const store = createAppStore();
  return {
    store,
    ...render(
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
        </ThemeProvider>
      </Provider>,
    ),
  };
}
