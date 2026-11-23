// frontend/src/__tests__/pages/LeadCardActions.test.tsx
import { screen, fireEvent, waitFor } from '@testing-library/react';
import LeadsPage from '../../pages/LeadsPage';
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

const todayIso = () => new Date().toISOString().split('T')[0];

beforeEach(() => {
  jest.clearAllMocks();
  server.use(
    rest.get('http://localhost:8000/api/leads/1/', (req, res, ctx) => {
      return res(ctx.status(200), ctx.json(fullLead));
    })
  );
});

async function openContactCard() {
  renderWithProviders(<LeadsPage />);
  await screen.findByText('John Doe');
  fireEvent.doubleClick(screen.getByText('John Doe'));
  await screen.findByTestId('contact-card');
}

test('lead card offers + New Estimate and Add follow-up', async () => {
  await openContactCard();
  expect(screen.getByTestId('contact-card-new-estimate')).toBeInTheDocument();
  expect(screen.getByTestId('contact-card-add-follow-up')).toBeInTheDocument();
});

test('Add follow-up on the lead card opens a form prefilled with that lead', async () => {
  await openContactCard();
  fireEvent.click(screen.getByTestId('contact-card-add-follow-up'));

  expect(await screen.findByText('Add follow-up')).toBeInTheDocument();
  expect(screen.getByTestId('follow-up-lead')).toHaveTextContent('John Doe');

  fireEvent.change(screen.getByTestId('follow-up-title'), {
    target: { value: 'Call John back' },
  });
  fireEvent.change(screen.getByTestId('follow-up-due_date'), {
    target: { value: todayIso() },
  });
  fireEvent.click(screen.getByTestId('follow-up-submit'));

  await waitFor(() => {
    expect(toast.success).toHaveBeenCalledWith('Follow-up created successfully');
  });
});

test('+ New Estimate on the lead card opens a form prefilled with that lead', async () => {
  await openContactCard();
  fireEvent.click(screen.getByTestId('contact-card-new-estimate'));

  expect(await screen.findByText('New Estimate')).toBeInTheDocument();
  // The lead select is prefilled with John Doe (id 1).
  expect(screen.getByTestId('estimate-lead')).toHaveValue('1');

  fireEvent.change(screen.getByTestId('estimate-title'), {
    target: { value: 'Deck repair quote' },
  });
  fireEvent.click(screen.getByTestId('estimate-submit'));

  await waitFor(() => {
    expect(toast.success).toHaveBeenCalledWith('Estimate created successfully');
  });
});
