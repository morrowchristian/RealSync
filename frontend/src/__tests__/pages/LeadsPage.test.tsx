// frontend/src/__tests__/pages/LeadsPage.test.tsx
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import LeadsPage from '../../pages/LeadsPage';
import { renderWithProviders } from '../test-utils';
import { server } from '../../mocks/server';
import { rest } from 'msw';
import { toast } from 'react-toastify';

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

test('single-click selects a lead without opening the contact card; double-click opens the modal card', async () => {
  server.use(
    rest.get('http://localhost:8000/api/leads/1/', (req, res, ctx) => {
      return res(ctx.status(200), ctx.json(fullLead));
    })
  );
  renderWithProviders(<LeadsPage />);
  await screen.findByText('John Doe');

  // Single-click selects/highlights the row only — no contact card, no modal.
  fireEvent.click(screen.getByText('John Doe'));
  await waitFor(() => {
    expect(screen.getByTestId('lead-row-1')).toHaveClass('bg-blue-50');
  });
  expect(screen.queryByTestId('contact-card')).not.toBeInTheDocument();
  expect(screen.queryByTestId('modal-dialog')).not.toBeInTheDocument();

  // Double-click opens the contact card in a modal, with all fields.
  fireEvent.doubleClick(screen.getByText('John Doe'));
  expect(await screen.findByTestId('contact-card')).toBeInTheDocument();
  expect(screen.getByTestId('modal-dialog')).toBeInTheDocument();
  expect(screen.getByText('Acme Corp')).toBeInTheDocument();
  expect(screen.getByText('Website')).toBeInTheDocument();
  expect(screen.getByText('Interested in a quote.')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'john@example.com' })).toHaveAttribute(
    'href',
    'mailto:john@example.com'
  );
});

test('spreadsheet view kebab menu offers Edit / Archive / Delete', async () => {
  renderWithProviders(<LeadsPage />);
  await screen.findByText('John Doe');

  // The table is the only view — there is no Cards/Sheet toggle.
  expect(screen.queryByRole('button', { name: 'Cards' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Sheet' })).not.toBeInTheDocument();
  // ID and Company columns are present in the spreadsheet.
  expect(screen.getByRole('columnheader', { name: 'ID' })).toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: 'Company' })).toBeInTheDocument();

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

test('shows a hint that double-clicking a row opens the contact card', async () => {
  renderWithProviders(<LeadsPage />);
  await screen.findByText('John Doe');
  expect(
    screen.getByText('Double-click a row to open the contact card.')
  ).toBeInTheDocument();
});

test('contact card modal Archive and Delete buttons trigger the confirm flow', async () => {
  (toast.success as jest.Mock).mockClear();
  server.use(
    rest.get('http://localhost:8000/api/leads/1/', (req, res, ctx) => {
      return res(ctx.status(200), ctx.json(fullLead));
    })
  );
  renderWithProviders(<LeadsPage />);
  await screen.findByText('John Doe');
  fireEvent.doubleClick(screen.getByText('John Doe'));
  await screen.findByTestId('contact-card');

  // Both buttons render in the card modal.
  const modal = screen.getByTestId('modal-dialog');
  expect(within(modal).getByRole('button', { name: /Archive Lead/ })).toBeInTheDocument();
  expect(within(modal).getByRole('button', { name: /Delete Lead/ })).toBeInTheDocument();

  // Archive opens the confirm dialog; cancelling leaves the card modal open.
  fireEvent.click(within(modal).getByRole('button', { name: /Archive Lead/ }));
  expect(await screen.findByText(/Archive Lead #1\?/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  await waitFor(() => {
    expect(screen.queryByText(/Archive Lead #1\?/)).not.toBeInTheDocument();
  });
  expect(screen.getByTestId('contact-card')).toBeInTheDocument();

  // Delete opens the confirm dialog; confirming deletes, toasts, closes
  // the modal, and the lead is gone from the list.
  // After the delete, the refetch returns a list without the deleted lead.
  server.use(
    rest.get('http://localhost:8000/api/leads/', (req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json([
          {
            id: 2,
            full_name: 'Jane Smith',
            email: 'jane@example.com',
            phone: '456',
            property_address: '456 Lane',
            status: 'contacted',
            agent: 1,
            created_at: '2024-01-02',
            is_archived: false,
          },
        ])
      );
    })
  );
  fireEvent.click(
    within(screen.getByTestId('modal-dialog')).getByRole('button', { name: /Delete Lead/ })
  );
  expect(await screen.findByText(/Permanently delete Lead #1\?/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Yes, delete' }));

  await waitFor(() => {
    expect(screen.queryByTestId('modal-dialog')).not.toBeInTheDocument();
  });
  expect(toast.success).toHaveBeenCalledWith('Lead deleted');
  await waitFor(() => {
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
  });
  expect(screen.getByText('Jane Smith')).toBeInTheDocument();
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
