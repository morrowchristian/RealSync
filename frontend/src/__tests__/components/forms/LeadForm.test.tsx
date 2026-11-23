import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LeadForm from '../../../components/forms/LeadForm';
import { renderWithProviders } from '../../test-utils';
import { server } from '../../../mocks/server';
import { rest } from 'msw';
import { toast } from 'react-toastify';

jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
  // test-utils renders <ToastContainer />; the mock must provide it or the
  // component is undefined and every render fails.
  ToastContainer: () => null,
}));

describe('LeadForm', () => {
  test('renders form fields', () => {
    renderWithProviders(<LeadForm mode="create" onSuccess={jest.fn()} />);
    expect(screen.getByTestId('lead-full_name')).toBeInTheDocument();
    expect(screen.getByTestId('lead-email')).toBeInTheDocument();
  });

  test('creates a lead and calls onSuccess', async () => {
    const mockSuccess = jest.fn();
    renderWithProviders(<LeadForm mode="create" onSuccess={mockSuccess} />);
    
    fireEvent.change(screen.getByTestId('lead-full_name'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByTestId('lead-email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByTestId('lead-property_address'), { target: { value: '123 Main' } });
    fireEvent.click(screen.getByTestId('lead-submit'));

    await waitFor(() => {
      expect(mockSuccess).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Lead created successfully');
    });
  });

  test('handles API error gracefully', async () => {
    server.use(
      rest.post('http://localhost:8000/api/leads/', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    renderWithProviders(<LeadForm mode="create" onSuccess={jest.fn()} />);
    fireEvent.change(screen.getByTestId('lead-full_name'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByTestId('lead-email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByTestId('lead-property_address'), { target: { value: '123 Main' } });
    fireEvent.click(screen.getByTestId('lead-submit'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Error submitting lead');
    });
  });

  test('renders a visible label for every field and groups into sections', () => {
    renderWithProviders(<LeadForm mode="create" onSuccess={jest.fn()} />);
    expect(screen.getByText('Contact')).toBeInTheDocument();
    expect(screen.getByText('Details')).toBeInTheDocument();
    expect(screen.getByText('Lead Info')).toBeInTheDocument();
    expect(screen.getByLabelText(/Full Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Phone/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Company/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Property Address/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Lead Source/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Preferred Contact/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Status/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Notes/)).toBeInTheDocument();
  });

  test('shows inline errors and does not submit when required fields are missing', async () => {
    const mockSuccess = jest.fn();
    renderWithProviders(<LeadForm mode="create" onSuccess={mockSuccess} />);
    fireEvent.click(screen.getByTestId('lead-submit'));

    await waitFor(() => {
      expect(screen.getByText('Full name is required')).toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Property address is required')).toBeInTheDocument();
    });
    expect(mockSuccess).not.toHaveBeenCalled();
  });

  test('rejects an invalid email and an invalid phone, and clears the error once fixed', async () => {
    const mockSuccess = jest.fn();
    renderWithProviders(<LeadForm mode="create" onSuccess={mockSuccess} />);
    fireEvent.change(screen.getByTestId('lead-full_name'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByTestId('lead-email'), { target: { value: 'not-an-email' } });
    fireEvent.change(screen.getByTestId('lead-phone'), { target: { value: 'abc' } });
    fireEvent.change(screen.getByTestId('lead-property_address'), { target: { value: '123 Main' } });
    fireEvent.click(screen.getByTestId('lead-submit'));

    await waitFor(() => {
      expect(screen.getByText('Enter a valid email address')).toBeInTheDocument();
      expect(screen.getByText('Enter a valid phone number')).toBeInTheDocument();
    });
    expect(mockSuccess).not.toHaveBeenCalled();

    // Fixing the fields live-clears their errors.
    fireEvent.change(screen.getByTestId('lead-email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByTestId('lead-phone'), { target: { value: '+1 (423) 555-0123' } });
    await waitFor(() => {
      expect(screen.queryByText('Enter a valid email address')).not.toBeInTheDocument();
      expect(screen.queryByText('Enter a valid phone number')).not.toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('lead-submit'));
    await waitFor(() => expect(mockSuccess).toHaveBeenCalled());
  });

  test('hides a built-in field when the form settings say visible=false', async () => {
    server.use(
      rest.get('http://localhost:8000/api/lead-form-settings/', (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json({
            field_config: {
              company: { visible: false, required: false },
              lead_source: { visible: true, required: false },
              notes: { visible: true, required: false },
              preferred_contact: { visible: true, required: false },
              phone: { visible: true, required: false },
              property_address: { visible: true, required: true },
            },
          })
        );
      })
    );
    renderWithProviders(<LeadForm mode="create" onSuccess={jest.fn()} />);
    await waitFor(() => {
      expect(screen.queryByTestId('lead-company')).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('lead-phone')).toBeInTheDocument();
  });

  test('renders active custom fields, enforces required ones, and prefills custom_data in edit mode', async () => {
    server.use(
      rest.get('http://localhost:8000/api/custom-fields/', (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json([
            {
              id: 1,
              agent: 1,
              name: 'budget_range',
              label: 'Budget Range',
              field_type: 'dropdown',
              required: true,
              options: ['Low', 'Medium', 'High'],
              order: 0,
              is_active: true,
            },
            {
              id: 2,
              agent: 1,
              name: 'nickname',
              label: 'Nickname',
              field_type: 'text',
              required: false,
              options: [],
              order: 1,
              is_active: true,
            },
            {
              id: 3,
              agent: 1,
              name: 'archived_field',
              label: 'Archived Field',
              field_type: 'text',
              required: false,
              options: [],
              order: 2,
              is_active: false,
            },
          ])
        );
      })
    );

    const mockSuccess = jest.fn();
    renderWithProviders(
      <LeadForm
        mode="edit"
        initialData={{
          id: 1,
          full_name: 'Test User',
          email: 'test@example.com',
          phone: '',
          property_address: '123 Main',
          status: 'new',
          agent: 1,
          custom_data: { budget_range: 'High', nickname: 'TJ' },
        }}
        onSuccess={mockSuccess}
      />
    );

    // Active custom fields render (prefilled); inactive ones do not.
    const budget = await screen.findByTestId('lead-custom-budget_range');
    expect(budget).toHaveValue('High');
    expect(screen.getByTestId('lead-custom-nickname')).toHaveValue('TJ');
    expect(screen.queryByTestId('lead-custom-archived_field')).not.toBeInTheDocument();
    expect(screen.getByText('Custom Fields')).toBeInTheDocument();

    // Clearing the required custom field blocks submit with an inline error.
    fireEvent.change(budget, { target: { value: '' } });
    fireEvent.click(screen.getByTestId('lead-submit'));
    await waitFor(() => {
      expect(screen.getByText('Budget Range is required')).toBeInTheDocument();
    });
    expect(mockSuccess).not.toHaveBeenCalled();
  });
});