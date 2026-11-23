// frontend/src/__tests__/pages/LeadsPage.test.tsx
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
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

test('New Lead modal keeps Create Lead and Cancel in the fixed footer', async () => {
  renderWithProviders(<LeadsPage />);
  await screen.findByText('John Doe');
  fireEvent.click(screen.getByRole('button', { name: '+ New Lead' }));

  expect(await screen.findByText('New Lead')).toBeInTheDocument();
  const footer = screen.getByTestId('modal-footer');
  const scroll = screen.getByTestId('modal-scroll');

  // Submit + Cancel (and Close) live in the fixed footer, visible on open.
  expect(within(footer).getByTestId('lead-submit')).toHaveTextContent('Create Lead');
  expect(within(footer).getByTestId('lead-cancel')).toBeInTheDocument();
  expect(within(footer).getByRole('button', { name: 'Close' })).toBeInTheDocument();
  // …and nowhere inside the scrollable form region.
  expect(within(scroll).queryByTestId('lead-submit')).not.toBeInTheDocument();
  expect(within(scroll).queryByTestId('lead-cancel')).not.toBeInTheDocument();

  // Cancel (from the footer) closes the modal.
  fireEvent.click(within(footer).getByTestId('lead-cancel'));
  await waitFor(() => {
    expect(screen.queryByTestId('modal-dialog')).not.toBeInTheDocument();
  });
});

test('submitting from the fixed footer creates the lead', async () => {
  renderWithProviders(<LeadsPage />);
  await screen.findByText('John Doe');
  fireEvent.click(screen.getByRole('button', { name: '+ New Lead' }));
  await screen.findByText('New Lead');

  fireEvent.change(screen.getByTestId('lead-full_name'), { target: { value: 'Footer User' } });
  fireEvent.change(screen.getByTestId('lead-email'), { target: { value: 'footer@example.com' } });
  fireEvent.change(screen.getByTestId('lead-property_address'), { target: { value: '789 Footer Rd' } });
  // The submit button sits outside the <form> element (fixed footer), so
  // this also proves the form-attribute wiring submits the form.
  fireEvent.click(within(screen.getByTestId('modal-footer')).getByTestId('lead-submit'));

  await waitFor(() => {
    expect(screen.queryByTestId('modal-dialog')).not.toBeInTheDocument();
  });
});

test('Edit Lead modal keeps Update Lead in the fixed footer and Archive/Delete in the body', async () => {
  server.use(
    rest.get('http://localhost:8000/api/leads/1/', (req, res, ctx) => {
      return res(ctx.status(200), ctx.json(fullLead));
    })
  );
  renderWithProviders(<LeadsPage />);
  await screen.findByText('John Doe');
  fireEvent.click(screen.getByTestId('lead-kebab-1'));
  fireEvent.click(screen.getByTestId('lead-menu-edit-1'));

  expect(await screen.findByText('Edit Lead')).toBeInTheDocument();
  const footer = screen.getByTestId('modal-footer');
  const scroll = screen.getByTestId('modal-scroll');

  expect(within(footer).getByTestId('lead-submit')).toHaveTextContent('Update Lead');
  expect(within(footer).getByTestId('lead-cancel')).toBeInTheDocument();
  expect(within(scroll).queryByTestId('lead-submit')).not.toBeInTheDocument();
  // Archive/Delete stay in the scrollable body and still render.
  expect(within(scroll).getByRole('button', { name: /Archive Lead/ })).toBeInTheDocument();
  expect(within(scroll).getByRole('button', { name: /Delete Lead/ })).toBeInTheDocument();
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
