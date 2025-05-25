// frontend/src/__tests__/test-utils.tsx
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import type { ReactNode } from 'react';

export function renderWithProviders(ui: ReactNode, { route = '/' } = {}) {
  window.history.pushState({}, 'Test page', route);
  return render(
    <MemoryRouter initialEntries={[route]}>
      {ui}
      <ToastContainer />
    </MemoryRouter>
  );
}