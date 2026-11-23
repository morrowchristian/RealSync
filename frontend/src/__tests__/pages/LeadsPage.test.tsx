// frontend/src/__tests__/pages/LeadsPage.test.tsx
import { screen } from '@testing-library/react';
import LeadsPage from '../../pages/LeadsPage';
import { renderWithProviders } from '../test-utils';

test('renders LeadsPage with "All Leads"', async () => {
  renderWithProviders(<LeadsPage />);
  expect(await screen.findByText(/All Leads/i)).toBeInTheDocument();
});