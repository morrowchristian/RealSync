// frontend/src/__tests__/pages/DemoPage.test.tsx
import { screen } from '@testing-library/react';
import DemoPage from '../../pages/DemoPage';
import { renderWithProviders } from '../test-utils';

describe('DemoPage', () => {
  beforeEach(() => {
    // The demo is public: no token must be needed.
    localStorage.clear();
  });

  test('renders the read-only demo from the public payload', async () => {
    renderWithProviders(<DemoPage />);

    // Banner with the exact text and links to signup / login. The phrase
    // is split across elements by the links, so assert on the banner's
    // full text content.
    const banner = await screen.findByText(/You're viewing a read-only demo/);
    expect(banner.closest('div')).toHaveTextContent(
      "You're viewing a read-only demo — sign up to try it yourself"
    );
    expect(screen.getByRole('link', { name: /sign up/i })).toHaveAttribute(
      'href',
      '/signup'
    );
    expect(screen.getByRole('link', { name: /log in/i })).toHaveAttribute(
      'href',
      '/login'
    );

    // Stat cards from the demo stats.
    expect(screen.getByText('Total Leads')).toBeInTheDocument();
    expect(screen.getByText('Active Leads')).toBeInTheDocument();
    expect(screen.getByText('Total Contracts')).toBeInTheDocument();
    expect(screen.getByText('Contracts Pending Signature')).toBeInTheDocument();

    // Leads by status, recent leads, leads table, contracts.
    expect(screen.getByText('Leads by Status')).toBeInTheDocument();
    // Each demo lead appears twice: recent leads + the leads table.
    expect(screen.getAllByText('Demo Lead One')).toHaveLength(2);
    expect(screen.getAllByText('Demo Lead Two')).toHaveLength(2);
    expect(screen.getByText('one@example.com')).toBeInTheDocument();
    expect(screen.getByText('Lead: Demo Lead One')).toBeInTheDocument();
  });

  test('has no New/Edit/Delete/Archive buttons, forms, or lead selection', async () => {
    renderWithProviders(<DemoPage />);
    await screen.findAllByText('Demo Lead One');

    expect(
      screen.queryByRole('button', { name: /new lead/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /edit/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /delete/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /archive/i })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('form')).not.toBeInTheDocument();
    // Lead rows are not clickable (no editor opens on click).
    expect(screen.queryByText(/Edit Lead/)).not.toBeInTheDocument();
  });
});
