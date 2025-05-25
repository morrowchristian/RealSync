// frontend/src/__tests__/pages/LeadsPage.test.tsx
import { screen } from '@testing-library/react';
import LeadsPage from '../../pages/LeadsPage';
import { renderWithProviders } from '../test-utils';

test('renders LeadsPage with "All Leads"', () => {
  renderWithProviders(<LeadsPage />);
  expect(screen.getByText(/All Leads/i)).toBeInTheDocument();
});