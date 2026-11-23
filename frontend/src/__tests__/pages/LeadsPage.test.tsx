// frontend/src/__tests__/pages/LeadsPage.test.tsx
import { screen, fireEvent, waitFor } from '@testing-library/react';
import LeadsPage from '../../pages/LeadsPage';
import { renderWithProviders } from '../test-utils';
import { server } from '../../mocks/server';
import { rest } from 'msw';

jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
  ToastContainer: () => null,
}));

const fullLead = {
  id: 1,
  full_name: 'John Doe',
  email: 'john@example.com',
  phone: '123-456-7890',
  property_address: '123 Lane',
  status: 'new',
  agent: 1,
  created_at: '2024-01-01',
  is_archived: false,
  company: 'Acme Corp',
  lead_source: 'website',
  notes: 'Interested in a quote.',
  preferred_contact: 'email',
  custom_data: {},
};

test('renders LeadsPage with "Leads" heading and total count', async () => {
  renderWithProviders(<LeadsPage />);
  expect(await screen.findByRole('heading', { name: 'Leads' })).toBeInTheDocument();
  expect(await screen.findByText('Total 2')).toBeInTheDocument();
});

test('clicking a lead opens the contact card with all fields', async () => {
  server.use(
    rest.get('http://localhost:8000/api/leads/1/', (req, res, ctx) => {
      return res(ctx.status(200), ctx.json(fullLead));
    })
  );
  renderWithProviders(<LeadsPage />);
  await screen.findByText('John Doe');
  fireEvent.click(screen.getByText('John Doe'));

  expect(await screen.findByTestId('contact-card')).toBeInTheDocument();
  expect(screen.getByText('Acme Corp')).toBeInTheDocument();
  expect(screen.getByText('Website')).toBeInTheDocument();
  expect(screen.getByText('Interested in a quote.')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'john@example.com' })).toHaveAttribute(
    'href',
    'mailto:john@example.com'
  );
});

test('sheet view kebab menu offers Edit / Archive / Delete', async () => {
  renderWithProviders(<LeadsPage />);
  await screen.findByText('John Doe');
  fireEvent.click(screen.getByRole('button', { name: 'Sheet' }));
  fireEvent.click(screen.getByTestId('lead-kebab-1'));

  expect(screen.getByTestId('lead-menu-1')).toBeInTheDocument();
  expect(screen.getByTestId('lead-menu-edit-1')).toBeInTheDocument();
  expect(screen.getByTestId('lead-menu-archive-1')).toBeInTheDocument();
  expect(screen.getByTestId('lead-menu-delete-1')).toBeInTheDocument();

  // Edit opens the edit modal with the lead prefilled.
  fireEvent.click(screen.getByTestId('lead-menu-edit-1'));
  expect(await screen.findByText('Edit Lead')).toBeInTheDocument();
  expect(screen.getByTestId('lead-full_name')).toHaveValue('John Doe');
});

test('search filters the list and the status filter works', async () => {
  renderWithProviders(<LeadsPage />);
  await screen.findByText('John Doe');
  expect(screen.getByText('Jane Smith')).toBeInTheDocument();

  fireEvent.change(screen.getByTestId('leads-search'), {
    target: { value: 'jane' },
  });
  await waitFor(() => {
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  fireEvent.change(screen.getByTestId('leads-search'), { target: { value: '' } });
  fireEvent.change(screen.getByTestId('leads-filter'), {
    target: { value: 'Contacted' },
  });
  await waitFor(() => {
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });
});
