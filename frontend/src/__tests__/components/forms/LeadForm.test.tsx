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
});