// frontend/src/__tests__/pages/DashboardPage.test.tsx
import { screen, within } from '@testing-library/react';
import { rest } from 'msw';
import DashboardPage from '../../pages/DashboardPage';
import { renderWithProviders } from '../test-utils';
import { server } from '../../mocks/server';

// Default MSW handlers return 2 leads (John Doe: new, Jane Smith: contacted)
// and 2 contracts (1 pending, 1 signed).

test('renders four stat cards with real counts and honest captions', async () => {
  renderWithProviders(<DashboardPage />);

  const activeLeads = await screen.findByTestId('stat-active-leads');
  expect(within(activeLeads).getByText('Active Leads')).toBeInTheDocument();
  expect(within(activeLeads).getByText('2')).toBeInTheDocument();
  expect(within(activeLeads).getByText('across all statuses')).toBeInTheDocument();

  const totalContracts = screen.getByTestId('stat-total-contracts');
  expect(within(totalContracts).getByText('Total Contracts')).toBeInTheDocument();
  expect(within(totalContracts).getByText('2')).toBeInTheDocument();
  expect(within(totalContracts).getByText('1 signed')).toBeInTheDocument();

  const pending = screen.getByTestId('stat-pending-contracts');
  expect(within(pending).getByText('Contracts Pending Signature')).toBeInTheDocument();
  expect(within(pending).getByText('1')).toBeInTheDocument();
  expect(within(pending).getByText('of 2 total contracts')).toBeInTheDocument();

  const converted = screen.getByTestId('stat-converted-leads');
  expect(within(converted).getByText('Converted Leads')).toBeInTheDocument();
  expect(within(converted).getByText('0')).toBeInTheDocument();
  expect(within(converted).getByText('of 2 total leads')).toBeInTheDocument();

  // No invented trend percentages.
  expect(screen.queryByText(/%/)).not.toBeInTheDocument();
});

test('renders leads by status and recent leads with links to /leads', async () => {
  renderWithProviders(<DashboardPage />);

  expect(await screen.findByText('Leads by Status')).toBeInTheDocument();
  expect(screen.getByText('Recent Leads')).toBeInTheDocument();

  const johnLink = screen.getByRole('link', { name: 'John Doe' });
  expect(johnLink).toHaveAttribute('href', '/leads');
  expect(screen.getByRole('link', { name: 'Jane Smith' })).toHaveAttribute(
    'href',
    '/leads',
  );
});

test('shows the "No leads yet." empty state when there are no leads', async () => {
  server.use(
    rest.get('http://localhost:8000/api/leads/', (_req, res, ctx) =>
      res(ctx.status(200), ctx.json([])),
    ),
    rest.get('http://localhost:8000/api/contracts/', (_req, res, ctx) =>
      res(ctx.status(200), ctx.json([])),
    ),
  );

  renderWithProviders(<DashboardPage />);

  expect(await screen.findByText('No leads yet.')).toBeInTheDocument();
  const activeLeads = screen.getByTestId('stat-active-leads');
  expect(within(activeLeads).getByText('0')).toBeInTheDocument();
});
