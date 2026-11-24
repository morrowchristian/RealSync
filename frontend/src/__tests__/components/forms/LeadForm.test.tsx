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

  test('submits backend choice keys for lead source / preferred contact and omits agent', async () => {
    let capturedBody: any = null;
    server.use(
      rest.post('http://localhost:8000/api/leads/', async (req, res, ctx) => {
        capturedBody = await req.json();
        return res(ctx.status(201), ctx.json({ id: 3, ...capturedBody }));
      })
    );

    const mockSuccess = jest.fn();
    renderWithProviders(<LeadForm mode="create" onSuccess={mockSuccess} />);
    fireEvent.change(screen.getByTestId('lead-full_name'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByTestId('lead-email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByTestId('lead-property_address'), { target: { value: '123 Main' } });
    fireEvent.change(screen.getByTestId('lead-lead_source'), { target: { value: 'referral' } });
    fireEvent.change(screen.getByTestId('lead-preferred_contact'), { target: { value: 'phone' } });
    fireEvent.click(screen.getByTestId('lead-submit'));

    await waitFor(() => expect(mockSuccess).toHaveBeenCalled());
    expect(capturedBody.lead_source).toBe('referral');
    expect(capturedBody.preferred_contact).toBe('phone');
    expect(capturedBody).not.toHaveProperty('agent');
  });

  test('prefills the saved backend key in the dropdowns in edit mode', () => {
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
          lead_source: 'walk_in',
          preferred_contact: 'either',
        }}
        onSuccess={jest.fn()}
      />
    );
    expect(screen.getByTestId('lead-lead_source')).toHaveValue('walk_in');
    expect(screen.getByTestId('lead-preferred_contact')).toHaveValue('either');
  });

  test('surfaces a server 400 field error next to the field and in the toast', async () => {
    server.use(
      rest.post('http://localhost:8000/api/leads/', (req, res, ctx) => {
        return res(
          ctx.status(400),
          ctx.json({ lead_source: ['"Referral" is not a valid choice.'] })
        );
      })
    );

    const mockSuccess = jest.fn();
    renderWithProviders(<LeadForm mode="create" onSuccess={mockSuccess} />);
    fireEvent.change(screen.getByTestId('lead-full_name'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByTestId('lead-email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByTestId('lead-property_address'), { target: { value: '123 Main' } });
    fireEvent.click(screen.getByTestId('lead-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('lead-lead_source-error')).toHaveTextContent(
        '"Referral" is not a valid choice.'
      );
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('not a valid choice')
      );
    });
    expect(mockSuccess).not.toHaveBeenCalled();
  });

  test('surfaces a server detail message in the toast', async () => {
    server.use(
      rest.post('http://localhost:8000/api/leads/', (req, res, ctx) => {
        return res(
          ctx.status(400),
          ctx.json({ detail: 'Trial limit reached: 50 leads max.' })
        );
      })
    );

    renderWithProviders(<LeadForm mode="create" onSuccess={jest.fn()} />);
    fireEvent.change(screen.getByTestId('lead-full_name'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByTestId('lead-email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByTestId('lead-property_address'), { target: { value: '123 Main' } });
    fireEvent.click(screen.getByTestId('lead-submit'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Trial limit reached: 50 leads max.'
      );
    });
  });

  test('rejects a phone longer than 20 characters client-side', async () => {
    const mockSuccess = jest.fn();
    renderWithProviders(<LeadForm mode="create" onSuccess={mockSuccess} />);
    fireEvent.change(screen.getByTestId('lead-full_name'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByTestId('lead-email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByTestId('lead-phone'), {
      target: { value: '+1 (423) 555-01234567890' },
    });
    fireEvent.change(screen.getByTestId('lead-property_address'), { target: { value: '123 Main' } });
    fireEvent.click(screen.getByTestId('lead-submit'));

    await waitFor(() => {
      expect(screen.getByText('Phone number must be 20 characters or fewer')).toBeInTheDocument();
    });
    expect(mockSuccess).not.toHaveBeenCalled();
  });

  test('stores a number custom field as a real number in custom_data', async () => {
    let capturedBody: any = null;
    server.use(
      rest.get('http://localhost:8000/api/custom-fields/', (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json([
            {
              id: 1,
              agent: 1,
              name: 'budget',
              label: 'Budget',
              field_type: 'number',
              required: false,
              options: [],
              order: 0,
              is_active: true,
            },
          ])
        );
      }),
      rest.post('http://localhost:8000/api/leads/', async (req, res, ctx) => {
        capturedBody = await req.json();
        return res(ctx.status(201), ctx.json({ id: 3, ...capturedBody }));
      })
    );

    const mockSuccess = jest.fn();
    renderWithProviders(<LeadForm mode="create" onSuccess={mockSuccess} />);
    const budget = await screen.findByTestId('lead-custom-budget');
    fireEvent.change(screen.getByTestId('lead-full_name'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByTestId('lead-email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByTestId('lead-property_address'), { target: { value: '123 Main' } });
    fireEvent.change(budget, { target: { value: '250000' } });
    fireEvent.click(screen.getByTestId('lead-submit'));

    await waitFor(() => expect(mockSuccess).toHaveBeenCalled());
    expect(typeof capturedBody.custom_data.budget).toBe('number');
    expect(capturedBody.custom_data.budget).toBe(250000);
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
    expect(screen.getByLabelText(/Job Site Address/)).toBeInTheDocument();
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
      expect(screen.getByText('Job site address is required')).toBeInTheDocument();
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

  test('shows the required star only on fields the settings mark required, and validates them', async () => {
    server.use(
      rest.get('http://localhost:8000/api/lead-form-settings/', (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json({
            field_config: {
              company: { visible: true, required: false },
              lead_source: { visible: true, required: false },
              notes: { visible: true, required: false },
              preferred_contact: { visible: true, required: false },
              phone: { visible: true, required: true },
              property_address: { visible: true, required: false },
            },
          })
        );
      })
    );
    const labelFor = (testId: string) =>
      document.querySelector(`label[for="${testId}"]`)?.textContent?.trim() ?? null;

    const mockSuccess = jest.fn();
    renderWithProviders(<LeadForm mode="create" onSuccess={mockSuccess} />);

    // The `*` follows the saved settings: Phone required, Job Site
    // Address not.
    await waitFor(() => expect(labelFor('lead-phone')).toBe('Phone *'));
    expect(labelFor('lead-property_address')).toBe('Job Site Address');
    expect(labelFor('lead-company')).toBe('Company');

    // Validation follows the same settings: an empty Phone blocks submit,
    // an empty Job Site Address does not.
    fireEvent.change(screen.getByTestId('lead-full_name'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByTestId('lead-email'), { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByTestId('lead-submit'));
    await waitFor(() => {
      expect(screen.getByText('Phone is required')).toBeInTheDocument();
    });
    expect(screen.queryByText('Job site address is required')).not.toBeInTheDocument();
    expect(mockSuccess).not.toHaveBeenCalled();
  });

  test('retries the settings fetch after a transient failure and still shows the saved required markers', async () => {
    let attempts = 0;
    server.use(
      rest.get('http://localhost:8000/api/lead-form-settings/', (req, res, ctx) => {
        attempts += 1;
        if (attempts === 1) {
          // Simulate the free backend failing once (e.g. cold start).
          return res(ctx.status(500));
        }
        return res(
          ctx.status(200),
          ctx.json({
            field_config: {
              company: { visible: true, required: false },
              lead_source: { visible: true, required: false },
              notes: { visible: true, required: false },
              preferred_contact: { visible: true, required: false },
              phone: { visible: true, required: true },
              property_address: { visible: true, required: false },
            },
          })
        );
      })
    );
    const labelFor = (testId: string) =>
      document.querySelector(`label[for="${testId}"]`)?.textContent?.trim() ?? null;

    renderWithProviders(<LeadForm mode="create" onSuccess={jest.fn()} />);

    // The first fetch fails, the retry succeeds, and the `*` follows the
    // saved settings instead of silently falling back to the defaults
    // (which would show no `*` on Phone).
    await waitFor(() => expect(labelFor('lead-phone')).toBe('Phone *'), {
      timeout: 5000,
    });
    expect(labelFor('lead-property_address')).toBe('Job Site Address');
    expect(attempts).toBeGreaterThan(1);
  });
});