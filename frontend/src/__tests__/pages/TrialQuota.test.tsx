// frontend/src/__tests__/pages/TrialQuota.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import SettingsPage from '../../pages/SettingsPage';
import LeadsPage from '../../pages/LeadsPage';
import ContractsPage from '../../pages/ContractsPage';
import { renderWithProviders } from '../test-utils';
import { server } from '../../mocks/server';
import { rest } from 'msw';

// Fake JWT whose payload is {"user_id": 1}, so getCurrentUserId() decodes it.
const TRIAL_USER_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxfQ.fakesignature';

const trialAgent = {
  id: 1,
  username: 'trialuser',
  email: 'trial@example.com',
  first_name: 'Trial',
  last_name: 'User',
  phone: '',
  company: '',
  is_trial: true,
  trial_ends_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
  days_remaining: 3,
};

const useTrialAgent = () => {
  server.use(
    rest.get('http://localhost:8000/api/agents/:id/', (req, res, ctx) => {
      return res(ctx.status(200), ctx.json(trialAgent));
    })
  );
};

describe('Trial status and quota display', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('access', TRIAL_USER_TOKEN);
    localStorage.setItem('refresh', 'fake-refresh-token');
  });

  afterEach(() => {
    localStorage.clear();
  });

  test('Settings shows "Trial ends in 3 days" and custom-field quota for a trial account', async () => {
    useTrialAgent();
    renderWithProviders(<SettingsPage />);

    expect(await screen.findByTestId('trial-status')).toHaveTextContent(
      'Trial ends in 3 days'
    );
    // No custom fields in the mock, so the trial quota reads 0 / 10.
    expect(await screen.findByTestId('custom-fields-quota')).toHaveTextContent(
      '0 / 10 custom fields'
    );
  });

  test('Settings shows "Full account" and no quota for a non-trial account', async () => {
    renderWithProviders(<SettingsPage />);

    expect(await screen.findByTestId('trial-status')).toHaveTextContent(
      'Full account'
    );
    // Let the custom-fields fetch settle, then confirm no quota text.
    await waitFor(() => {
      expect(screen.getByText('No custom fields yet. Add one below.')).toBeInTheDocument();
    });
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(screen.queryByTestId('custom-fields-quota')).not.toBeInTheDocument();
  });

  test('Leads page shows "N / 50 leads" for a trial account only', async () => {
    useTrialAgent();
    renderWithProviders(<LeadsPage />);

    // The mock returns 2 leads.
    expect(await screen.findByTestId('leads-quota')).toHaveTextContent(
      '2 / 50 leads'
    );
  });

  test('Leads page shows no quota text for a non-trial account', async () => {
    renderWithProviders(<LeadsPage />);

    await screen.findByText('John Doe');
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(screen.queryByTestId('leads-quota')).not.toBeInTheDocument();
  });

  test('Contracts page shows "N / 20 contracts" for a trial account only', async () => {
    useTrialAgent();
    renderWithProviders(<ContractsPage />);

    // The mock returns 2 contracts.
    expect(await screen.findByTestId('contracts-quota')).toHaveTextContent(
      '2 / 20 contracts'
    );
  });

  test('Contracts page shows no quota text for a non-trial account', async () => {
    renderWithProviders(<ContractsPage />);

    await screen.findByText('All Contracts');
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(screen.queryByTestId('contracts-quota')).not.toBeInTheDocument();
  });
});
