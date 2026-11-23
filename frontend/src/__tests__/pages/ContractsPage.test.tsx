// frontend/src/__tests__/pages/ContractsPage.test.tsx
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import ContractsPage from '../../pages/ContractsPage';
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

const fullContract = {
  id: 1,
  lead: 1,
  status: 'pending',
  document: '/path/to/doc1.pdf',
  is_archived: false,
  created_at: '2024-01-01',
};

const signedContract = {
  id: 2,
  lead: 2,
  status: 'signed',
  document: '/path/to/doc2.pdf',
  is_archived: false,
  created_at: '2024-01-02',
};

const useSingleContract = (contract: typeof fullContract) => {
  server.use(
    rest.get(`http://localhost:8000/api/contracts/${contract.id}/`, (req, res, ctx) => {
      return res(ctx.status(200), ctx.json(contract));
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

test('renders the spreadsheet table with columns and contract rows', async () => {
  renderWithProviders(<ContractsPage />);
  await screen.findByText('John Doe');

  expect(screen.getByRole('columnheader', { name: 'ID' })).toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: 'Lead' })).toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: 'Document' })).toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: 'Date Created' })).toBeInTheDocument();

  // Rows resolve the lead id to the lead's full name.
  expect(screen.getByText('John Doe')).toBeInTheDocument();
  expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  expect(screen.getByText('pending')).toBeInTheDocument();
  expect(screen.getByText('signed')).toBeInTheDocument();
  expect(screen.getAllByRole('link', { name: 'View PDF' })).toHaveLength(2);
  expect(screen.getAllByRole('link', { name: 'View PDF' })[0]).toHaveAttribute(
    'href',
    '/path/to/doc1.pdf'
  );
  expect(screen.getByText(shortDate('2024-01-01'))).toBeInTheDocument();
  expect(screen.getByText(shortDate('2024-01-02'))).toBeInTheDocument();
});

test('single-click selects/highlights the row but does not open the card', async () => {
  renderWithProviders(<ContractsPage />);
  await screen.findByText('John Doe');
  fireEvent.click(screen.getByText('John Doe'));

  expect(screen.queryByTestId('contract-card')).not.toBeInTheDocument();
  // …but the row is highlighted.
  expect(screen.getByText('John Doe').closest('tr')).toHaveClass('bg-blue-50');
});

test('double-click opens the modal card with lead, status, and document', async () => {
  useSingleContract(fullContract);
  renderWithProviders(<ContractsPage />);
  await screen.findByText('John Doe');
  fireEvent.doubleClick(screen.getByText('John Doe'));

  const card = await screen.findByTestId('contract-card');
  expect(screen.getByText('Contract #1')).toBeInTheDocument();
  expect(within(card).getByText('John Doe')).toBeInTheDocument();
  expect(within(card).getByText('pending')).toBeInTheDocument();
  expect(within(card).getByRole('link', { name: 'View PDF' })).toHaveAttribute(
    'href',
    '/path/to/doc1.pdf'
  );
  expect(within(card).getByRole('link', { name: 'Download' })).toHaveAttribute(
    'href',
    '/path/to/doc1.pdf'
  );
  expect(within(card).getByText(longDate('2024-01-01'))).toBeInTheDocument();
});

test("the modal card's Edit opens the edit form", async () => {
  useSingleContract(fullContract);
  renderWithProviders(<ContractsPage />);
  await screen.findByText('John Doe');
  fireEvent.doubleClick(screen.getByText('John Doe'));

  await screen.findByTestId('contract-card');
  fireEvent.click(screen.getByTestId('contract-card-edit'));

  expect(await screen.findByText('Edit Contract')).toBeInTheDocument();
  expect(screen.queryByTestId('contract-card')).not.toBeInTheDocument();
  expect(screen.getByTestId('contract-status')).toHaveValue('pending');
});

test('the modal card shows Archive/Delete and Delete on a signed contract warns', async () => {
  useSingleContract(signedContract);
  renderWithProviders(<ContractsPage />);
  await screen.findByText('Jane Smith');
  fireEvent.doubleClick(screen.getByText('Jane Smith'));

  await screen.findByTestId('contract-card');
  expect(screen.getByTestId('contract-card-archive')).toBeInTheDocument();
  expect(screen.getByTestId('contract-card-delete')).toBeInTheDocument();

  fireEvent.click(screen.getByTestId('contract-card-delete'));
  expect(toast.warn).toHaveBeenCalledWith('Signed contracts cannot be deleted.');
  // No confirmation is offered for a signed contract.
  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
});

test('Archive from the modal card confirms and closes the card', async () => {
  useSingleContract(fullContract);
  renderWithProviders(<ContractsPage />);
  await screen.findByText('John Doe');
  fireEvent.doubleClick(screen.getByText('John Doe'));

  await screen.findByTestId('contract-card');
  fireEvent.click(screen.getByTestId('contract-card-archive'));
  fireEvent.click(screen.getByRole('button', { name: 'Yes, archive' }));

  await waitFor(() => {
    expect(screen.queryByTestId('contract-card')).not.toBeInTheDocument();
  });
  expect(toast.success).toHaveBeenCalledWith('Contract archived');
});

test('kebab menu offers Edit / Archive / Delete', async () => {
  renderWithProviders(<ContractsPage />);
  await screen.findByText('John Doe');
  fireEvent.click(screen.getByTestId('contract-kebab-1'));

  expect(screen.getByTestId('contract-menu-1')).toBeInTheDocument();
  expect(screen.getByTestId('contract-menu-edit-1')).toBeInTheDocument();
  expect(screen.getByTestId('contract-menu-archive-1')).toBeInTheDocument();
  expect(screen.getByTestId('contract-menu-delete-1')).toBeInTheDocument();

  // Edit opens the edit modal with the contract prefilled.
  fireEvent.click(screen.getByTestId('contract-menu-edit-1'));
  expect(await screen.findByText('Edit Contract')).toBeInTheDocument();
  expect(screen.getByTestId('contract-status')).toHaveValue('pending');
});

test('hint text is present and there is no dropdown or inline detail panel', async () => {
  renderWithProviders(<ContractsPage />);
  await screen.findByText('John Doe');

  expect(
    screen.getByText('Double-click a row to open the contract card.')
  ).toBeInTheDocument();
  expect(screen.queryByText('Select a contract')).not.toBeInTheDocument();
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  expect(screen.queryByText('Contract #1')).not.toBeInTheDocument();
});
