// frontend/src/__tests__/pages/SignupPage.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SignupPage from '../../pages/SignupPage';
import { renderWithProviders } from '../test-utils';
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

const fillValidForm = (overrides: Record<string, string> = {}) => {
  const values = {
    username: 'newuser',
    email: 'new@example.com',
    password: 'password123',
    confirm: 'password123',
    ...overrides,
  };
  fireEvent.change(screen.getByPlaceholderText(/^username$/i), {
    target: { value: values.username },
  });
  fireEvent.change(screen.getByPlaceholderText(/^email$/i), {
    target: { value: values.email },
  });
  fireEvent.change(screen.getByPlaceholderText(/^password$/i), {
    target: { value: values.password },
  });
  fireEvent.change(screen.getByPlaceholderText(/confirm password/i), {
    target: { value: values.confirm },
  });
};

describe('SignupPage', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('shows inline errors for mismatched passwords', async () => {
    renderWithProviders(<SignupPage />);
    fillValidForm({ confirm: 'different123' });
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
    expect(localStorage.getItem('access')).toBeNull();
  });

  test('shows inline errors for a short password and a bad email', async () => {
    renderWithProviders(<SignupPage />);
    fillValidForm({ email: 'not-an-email', password: 'short', confirm: 'short' });
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText('Enter a valid email address')).toBeInTheDocument();
      expect(
        screen.getByText('Password must be at least 8 characters')
      ).toBeInTheDocument();
    });
    expect(localStorage.getItem('access')).toBeNull();
  });

  test('successful signup stores tokens and logs the user in directly', async () => {
    renderWithProviders(<SignupPage />);
    fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(localStorage.getItem('access')).toBeTruthy();
      expect(localStorage.getItem('refresh')).toBe('fake-refresh-token');
      expect(toast.success).toHaveBeenCalledWith(
        'Account created — welcome to RealSync'
      );
    });
  });

  test('shows the server error readably on a duplicate username', async () => {
    renderWithProviders(<SignupPage />);
    fillValidForm({ username: 'existinguser' });
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(
        screen.getByRole('alert')
      ).toHaveTextContent('A user with that username already exists.');
    });
    expect(localStorage.getItem('access')).toBeNull();
  });
});
