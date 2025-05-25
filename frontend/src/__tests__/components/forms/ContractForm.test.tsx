import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ContractForm from '../../../components/forms/ContractForm';
import { renderWithProviders } from '../test-utils';
import { server } from '../../mocks/server';
import { rest } from 'msw';
import { toast } from 'react-toastify';

jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const leads = [{ id: 1, full_name: 'John Doe' }];

describe('ContractForm', () => {
  test('renders form fields', () => {
    renderWithProviders(<ContractForm leads={leads} mode="create" onSuccess={jest.fn()} />);
    expect(screen.getByTestId('contract-lead')).toBeInTheDocument();
    expect(screen.getByTestId('contract-status')).toBeInTheDocument();
    expect(screen.getByTestId('contract-document')).toBeInTheDocument();
  });

  test('creates a contract and calls onSuccess', async () => {
    const mockSuccess = jest.fn();
    renderWithProviders(<ContractForm leads={leads} mode="create" onSuccess={mockSuccess} />);

    fireEvent.change(screen.getByTestId('contract-lead'), { target: { value: '1' } });
    fireEvent.change(screen.getByTestId('contract-status'), { target: { value: 'signed' } });
    const file = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });
    fireEvent.change(screen.getByTestId('contract-document'), { target: { files: [file] } });
    fireEvent.click(screen.getByTestId('contract-submit'));

    await waitFor(() => {
      expect(mockSuccess).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Contract created successfully');
    });
  });

  test('handles API error gracefully', async () => {
    server.use(
      rest.post('http://localhost:8000/api/contracts/', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    renderWithProviders(<ContractForm leads={leads} mode="create" onSuccess={jest.fn()} />);
    const file = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });
    fireEvent.change(screen.getByTestId('contract-document'), { target: { files: [file] } });
    fireEvent.click(screen.getByTestId('contract-submit'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Error submitting contract');
    });
  });
});