// frontend/src/__tests__/pages/LoginPage.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '../../pages/LoginPage';
import { renderWithProviders } from '../test-utils';

test('successful login with valid credentials', async () => {
  renderWithProviders(<LoginPage />);

  fireEvent.change(screen.getByPlaceholderText(/username/i), { target: { value: 'testuser' } });
  fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'password' } });
  fireEvent.click(screen.getByRole('button', { name: /log in/i }));

  await waitFor(() => {
    expect(screen.getByText(/login successful/i)).toBeInTheDocument();
  });
});

test('login fails with invalid credentials', async () => {
  renderWithProviders(<LoginPage />);

  fireEvent.change(screen.getByPlaceholderText(/username/i), { target: { value: 'wronguser' } });
  fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'wrongpass' } });
  fireEvent.click(screen.getByRole('button', { name: /log in/i }));

  await waitFor(() => {
    expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
  });
});