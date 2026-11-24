// frontend/src/__tests__/pages/EstimatesPage.test.tsx
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import EstimatesPage from '../../pages/EstimatesPage';
import { renderWithProviders } from '../test-utils';
import { server } from '../../mocks/server';
import { rest } from 'msw';
import { toast } from 'react-toastify';

jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
  ToastContainer: () => null,
}));

const fullEstimate = {
  id: 1,
  lead: 1,
  title: 'Kitchen remodel quote',
  description: 'Full kitchen remodel estimate',
  amount: '4500.00',
  status: 'sent',
  date_sent: '2024-01-05',
  notes: 'Call after sending',
  created_at: '2024-01-05',
};

const useSingleEstimate = (estimate: typeof fullEstimate) => {
  server.use(
    rest.get(`http://localhost:8000/api/estimates/${estimate.id}/`, (req, res, ctx) => {
      return res(ctx.status(200), ctx.json(estimate));
    })
  );
};

// Same formatters the page uses, so the expected strings hold in any TZ.
const shortDate = (value: string) =>
  new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
const longDate = (value: string) =>
  new Date(value).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

beforeEach(() => {
  jest.clearAllMocks();
});

test('renders the spreadsheet table with columns and estimate rows', async () => {
  renderWithProviders(<EstimatesPage />);
  await screen.findByText('Kitchen remodel quote');

  expect(screen.getByRole('columnheader', { name: 'ID' })).toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: 'Lead' })).toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: 'Title' })).toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: 'Amount' })).toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: 'Date Sent' })).toBeInTheDocument();

  // Rows resolve the lead id to the lead's full name.
  expect(screen.getByText('John Doe')).toBeInTheDocument();
  expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  expect(screen.getByText('Bathroom refresh')).toBeInTheDocument();
  expect(screen.getByText('$4,500.00')).toBeInTheDocument();
  expect(screen.getByText('$1,200.00')).toBeInTheDocument();
  // Plain-text statuses, no badges.
  expect(screen.getByText('Sent')).toBeInTheDocument();
  expect(screen.getByText('Won')).toBeInTheDocument();
  expect(screen.getByText(shortDate('2024-01-05'))).toBeInTheDocument();
  expect(screen.getByText(shortDate('2024-01-06'))).toBeInTheDocument();
});

test('search matches lead name and title', async () => {
  renderWithProviders(<EstimatesPage />);
  await screen.findByText('Kitchen remodel quote');

  fireEvent.change(screen.getByLabelText('Search estimates'), {
    target: { value: 'Bathroom' },
  });
  expect(screen.queryByText('Kitchen remodel quote')).not.toBeInTheDocument();
  expect(screen.getByText('Bathroom refresh')).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText('Search estimates'), {
    target: { value: 'Jane' },
  });
  expect(screen.getByText('Bathroom refresh')).toBeInTheDocument();
  expect(screen.queryByText('Kitchen remodel quote')).not.toBeInTheDocument();
});

test('single-click selects/highlights the row but does not open the card', async () => {
  renderWithProviders(<EstimatesPage />);
  await screen.findByText('Kitchen remodel quote');
  fireEvent.click(screen.getByText('Kitchen remodel quote'));

  expect(screen.queryByTestId('estimate-card')).not.toBeInTheDocument();
  // …but the row is highlighted.
  expect(screen.getByText('Kitchen remodel quote').closest('tr')).toHaveClass('bg-blue-50');
});

test('double-click opens the modal card with lead, title, amount, status, date, notes', async () => {
  useSingleEstimate(fullEstimate);
  renderWithProviders(<EstimatesPage />);
  await screen.findByText('Kitchen remodel quote');
  fireEvent.doubleClick(screen.getByText('Kitchen remodel quote'));

  const card = await screen.findByTestId('estimate-card');
  expect(screen.getByText('Estimate #1')).toBeInTheDocument();
  expect(within(card).getByText('John Doe')).toBeInTheDocument();
  expect(within(card).getByText('Kitchen remodel quote')).toBeInTheDocument();
  expect(within(card).getByText('Full kitchen remodel estimate')).toBeInTheDocument();
  expect(within(card).getByText('$4,500.00')).toBeInTheDocument();
  expect(within(card).getByText('Sent')).toBeInTheDocument();
  // Date Sent and Date Created are both 2024-01-05 in the seed.
  expect(within(card).getAllByText(longDate('2024-01-05'))).toHaveLength(2);
  expect(within(card).getByText('Call after sending')).toBeInTheDocument();
});

test("the modal card's Edit opens the edit form prefilled", async () => {
  useSingleEstimate(fullEstimate);
  renderWithProviders(<EstimatesPage />);
  await screen.findByText('Kitchen remodel quote');
  fireEvent.doubleClick(screen.getByText('Kitchen remodel quote'));

  await screen.findByTestId('estimate-card');
  fireEvent.click(screen.getByTestId('estimate-card-edit'));

  expect(await screen.findByText('Edit Estimate')).toBeInTheDocument();
  expect(screen.queryByTestId('estimate-card')).not.toBeInTheDocument();
  expect(screen.getByTestId('estimate-title')).toHaveValue('Kitchen remodel quote');
  expect(screen.getByTestId('estimate-amount')).toHaveValue(4500);
  expect(screen.getByTestId('estimate-status')).toHaveValue('sent');
});

test('creating an estimate from the + New Estimate pill succeeds', async () => {
  renderWithProviders(<EstimatesPage />);
  await screen.findByText('Kitchen remodel quote');

  fireEvent.click(screen.getByText('+ New Estimate'));
  expect(await screen.findByText('New Estimate')).toBeInTheDocument();

  fireEvent.change(screen.getByTestId('estimate-title'), {
    target: { value: 'Roof repair quote' },
  });
  fireEvent.change(screen.getByTestId('estimate-amount'), {
    target: { value: '850.50' },
  });
  // Submit lives in the modal's fixed footer (portaled), like LeadForm.
  fireEvent.click(screen.getByTestId('estimate-submit'));

  await waitFor(() => {
    expect(toast.success).toHaveBeenCalledWith('Estimate created successfully');
  });
  expect(screen.queryByText('New Estimate')).not.toBeInTheDocument();
});

test('editing an estimate from the kebab menu updates it', async () => {
  renderWithProviders(<EstimatesPage />);
  await screen.findByText('Kitchen remodel quote');
  fireEvent.click(screen.getByTestId('estimate-kebab-1'));
  fireEvent.click(screen.getByTestId('estimate-menu-edit-1'));

  expect(await screen.findByText('Edit Estimate')).toBeInTheDocument();
  expect(screen.getByTestId('estimate-title')).toHaveValue('Kitchen remodel quote');

  fireEvent.change(screen.getByTestId('estimate-title'), {
    target: { value: 'Kitchen remodel quote (revised)' },
  });
  fireEvent.click(screen.getByTestId('estimate-submit'));

  await waitFor(() => {
    expect(toast.success).toHaveBeenCalledWith('Estimate updated successfully');
  });
});

test('deleting an estimate from the kebab menu confirms and toasts', async () => {
  renderWithProviders(<EstimatesPage />);
  await screen.findByText('Kitchen remodel quote');
  fireEvent.click(screen.getByTestId('estimate-kebab-1'));
  fireEvent.click(screen.getByTestId('estimate-menu-delete-1'));

  fireEvent.click(screen.getByRole('button', { name: 'Yes, delete' }));

  await waitFor(() => {
    expect(toast.success).toHaveBeenCalledWith('Estimate deleted');
  });
});

test('deleting from the modal card confirms and closes the card', async () => {
  useSingleEstimate(fullEstimate);
  renderWithProviders(<EstimatesPage />);
  await screen.findByText('Kitchen remodel quote');
  fireEvent.doubleClick(screen.getByText('Kitchen remodel quote'));

  await screen.findByTestId('estimate-card');
  fireEvent.click(screen.getByTestId('estimate-card-delete'));
  fireEvent.click(screen.getByRole('button', { name: 'Yes, delete' }));

  await waitFor(() => {
    expect(screen.queryByTestId('estimate-card')).not.toBeInTheDocument();
  });
  expect(toast.success).toHaveBeenCalledWith('Estimate deleted');
});

test("the modal card's Add follow-up opens the follow-up form for the estimate", async () => {
  useSingleEstimate(fullEstimate);
  renderWithProviders(<EstimatesPage />);
  await screen.findByText('Kitchen remodel quote');
  fireEvent.doubleClick(screen.getByText('Kitchen remodel quote'));

  await screen.findByTestId('estimate-card');
  fireEvent.click(screen.getByTestId('estimate-card-add-follow-up'));

  expect(await screen.findByText('Add follow-up')).toBeInTheDocument();
  expect(screen.getByTestId('follow-up-estimate')).toHaveTextContent(
    'Kitchen remodel quote'
  );
  expect(screen.getByTestId('follow-up-lead')).toHaveTextContent('John Doe');
});

test('hint text is present', async () => {
  renderWithProviders(<EstimatesPage />);
  await screen.findByText('Kitchen remodel quote');

  expect(
    screen.getByText('Double-click a row to open the estimate card.')
  ).toBeInTheDocument();
});
