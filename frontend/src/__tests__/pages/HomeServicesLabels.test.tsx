// frontend/src/__tests__/pages/HomeServicesLabels.test.tsx
import { screen, fireEvent, within } from '@testing-library/react';
import LeadsPage from '../../pages/LeadsPage';
import SettingsPage from '../../pages/SettingsPage';
import DemoPage from '../../pages/DemoPage';
import { renderWithProviders } from '../test-utils';
import { server } from '../../mocks/server';
import { rest } from 'msw';

jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
  ToastContainer: () => null,
}));

const fullLead = {
  id: 1,
  full_name: 'John Doe',
  email: 'john@example.com',
  phone: '123',
  company: 'Acme Corp',
  property_address: '123 Lane',
  lead_source: 'website',
  preferred_contact: 'email',
  status: 'new',
  notes: 'Interested in a quote.',
  agent: 1,
  created_at: '2024-01-01',
  is_archived: false,
  custom_data: {},
};

test('Leads spreadsheet uses "Job Site Address", never "Property Address"', async () => {
  renderWithProviders(<LeadsPage />);
  await screen.findByText('John Doe');

  expect(
    screen.getByRole('columnheader', { name: 'Job Site Address' })
  ).toBeInTheDocument();
  expect(screen.queryByText('Property Address')).not.toBeInTheDocument();
});

test('contact card uses "Job Site Address"', async () => {
  server.use(
    rest.get('http://localhost:8000/api/leads/1/', (req, res, ctx) => {
      return res(ctx.status(200), ctx.json(fullLead));
    })
  );
  renderWithProviders(<LeadsPage />);
  await screen.findByText('John Doe');
  fireEvent.doubleClick(screen.getByText('John Doe'));

  const card = await screen.findByTestId('contact-card');
  expect(within(card).getByText('Job Site Address')).toBeInTheDocument();
  expect(within(card).queryByText('Property Address')).not.toBeInTheDocument();
});

test('Settings profile shows "Company", never "Brokerage"', async () => {
  // Fake JWT whose payload is {"user_id": 1}, so getCurrentUserId() decodes it.
  localStorage.setItem(
    'access',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxfQ.fakesignature'
  );
  try {
    renderWithProviders(<SettingsPage />);
    await screen.findByText('Profile');

    expect(screen.getByText('Company:')).toBeInTheDocument();
    expect(screen.queryByText('Brokerage:')).not.toBeInTheDocument();
    expect(screen.queryByText(/Brokerage/)).not.toBeInTheDocument();
  } finally {
    localStorage.clear();
  }
});

test('Demo page uses "Job Site Address"', async () => {
  renderWithProviders(<DemoPage />);
  await screen.findByText('All Leads');

  expect(screen.getByText('Job Site Address')).toBeInTheDocument();
  expect(screen.queryByText('Property Address')).not.toBeInTheDocument();
});
