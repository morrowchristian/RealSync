// frontend/src/__tests__/pages/FollowUpsPage.test.tsx
import { screen, fireEvent, waitFor } from '@testing-library/react';
import FollowUpsPage from '../../pages/FollowUpsPage';
import { renderWithProviders } from '../test-utils';
import { toast } from 'react-toastify';

jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
  ToastContainer: () => null,
}));

// Same formatter the page uses, so the expected strings hold in any TZ.
const shortDate = (value: string) =>
  new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const todayIso = () => new Date().toISOString().split('T')[0];
const yesterdayIso = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
};

beforeEach(() => {
  jest.clearAllMocks();
});

test('renders the spreadsheet table with columns and follow-up rows', async () => {
  renderWithProviders(<FollowUpsPage />);
  await screen.findByText('Call John about kitchen quote');

  expect(screen.getByRole('columnheader', { name: 'Title' })).toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: 'Lead' })).toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: 'Due Date' })).toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument();

  // Rows resolve the lead id to the lead's full name (John Doe owns two
  // follow-ups, Jane Smith two).
  expect(screen.getAllByText('John Doe')).toHaveLength(2);
  expect(screen.getAllByText('Jane Smith')).toHaveLength(2);
  expect(screen.getByText('Email Jane the service agreement')).toBeInTheDocument();
  expect(screen.getByText(shortDate(todayIso()))).toBeInTheDocument();
  expect(screen.getAllByText(shortDate(yesterdayIso()))).toHaveLength(2);
  // Plain-text statuses, no badges.
  expect(screen.getAllByText('Pending')).toHaveLength(3);
  expect(screen.getByText('Done')).toBeInTheDocument();
});

test('mark-done toggles the row status and can be undone', async () => {
  renderWithProviders(<FollowUpsPage />);
  await screen.findByText('Call John about kitchen quote');

  fireEvent.click(screen.getByTestId('follow-up-kebab-1'));
  fireEvent.click(screen.getByTestId('follow-up-menu-toggle-1'));

  await waitFor(() => {
    expect(toast.success).toHaveBeenCalledWith('Follow-up marked done');
  });
  expect(
    screen.getByTestId('follow-up-row-1').textContent
  ).toContain('Done');

  // Undo from the same kebab.
  fireEvent.click(screen.getByTestId('follow-up-kebab-1'));
  expect(screen.getByTestId('follow-up-menu-toggle-1')).toHaveTextContent(
    'Mark not done'
  );
  fireEvent.click(screen.getByTestId('follow-up-menu-toggle-1'));

  await waitFor(() => {
    expect(toast.success).toHaveBeenCalledWith('Follow-up marked not done');
  });
  expect(
    screen.getByTestId('follow-up-row-1').textContent
  ).toContain('Pending');
});

test('creating a follow-up from the + New Follow-up pill succeeds', async () => {
  renderWithProviders(<FollowUpsPage />);
  await screen.findByText('Call John about kitchen quote');

  fireEvent.click(screen.getByText('+ New Follow-up'));
  expect(await screen.findByText('New Follow-up')).toBeInTheDocument();

  fireEvent.change(screen.getByTestId('follow-up-title'), {
    target: { value: 'Text John the quote' },
  });
  fireEvent.change(screen.getByTestId('follow-up-due_date'), {
    target: { value: todayIso() },
  });
  // Submit lives in the modal's fixed footer (portaled), like LeadForm.
  fireEvent.click(screen.getByTestId('follow-up-submit'));

  await waitFor(() => {
    expect(toast.success).toHaveBeenCalledWith('Follow-up created successfully');
  });
  expect(screen.queryByText('New Follow-up')).not.toBeInTheDocument();
});

test('editing a follow-up from the kebab menu updates it', async () => {
  renderWithProviders(<FollowUpsPage />);
  await screen.findByText('Call John about kitchen quote');
  fireEvent.click(screen.getByTestId('follow-up-kebab-1'));
  fireEvent.click(screen.getByTestId('follow-up-menu-edit-1'));

  expect(await screen.findByText('Edit Follow-up')).toBeInTheDocument();
  expect(screen.getByTestId('follow-up-title')).toHaveValue(
    'Call John about kitchen quote'
  );

  fireEvent.change(screen.getByTestId('follow-up-title'), {
    target: { value: 'Call John about kitchen quote (updated)' },
  });
  fireEvent.click(screen.getByTestId('follow-up-submit'));

  await waitFor(() => {
    expect(toast.success).toHaveBeenCalledWith('Follow-up updated successfully');
  });
});

test('deleting a follow-up from the kebab menu confirms and toasts', async () => {
  renderWithProviders(<FollowUpsPage />);
  await screen.findByText('Call John about kitchen quote');
  fireEvent.click(screen.getByTestId('follow-up-kebab-1'));
  fireEvent.click(screen.getByTestId('follow-up-menu-delete-1'));

  fireEvent.click(screen.getByRole('button', { name: 'Yes, delete' }));

  await waitFor(() => {
    expect(toast.success).toHaveBeenCalledWith('Follow-up deleted');
  });
});

test('search matches title and lead name', async () => {
  renderWithProviders(<FollowUpsPage />);
  await screen.findByText('Call John about kitchen quote');

  fireEvent.change(screen.getByLabelText('Search follow-ups'), {
    target: { value: 'Jane' },
  });
  expect(screen.queryByText('Call John about kitchen quote')).not.toBeInTheDocument();
  expect(screen.getByText('Email Jane the service agreement')).toBeInTheDocument();
});
