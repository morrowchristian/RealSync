// frontend/src/__tests__/pages/LoginPage.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '../../pages/LoginPage';
import { renderWithProviders } from '../test-utils';
import { server } from '../../mocks/server';
import { rest } from 'msw';

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

test('links to signup and to the read-only demo', () => {
  renderWithProviders(<LoginPage />);

  expect(screen.getByRole('link', { name: /sign up/i })).toHaveAttribute(
    'href',
    '/signup'
  );
  expect(
    screen.getByRole('link', { name: /view a read-only demo/i })
  ).toHaveAttribute('href', '/demo');
});

test('surfaces a trial-expired server message instead of "Invalid credentials"', async () => {
  server.use(
    rest.post('http://localhost:8000/api/token/', (req, res, ctx) => {
      return res(
        ctx.status(400),
        ctx.json({ detail: 'Your trial has expired. Please upgrade to continue.' })
      );
    })
  );

  renderWithProviders(<LoginPage />);

  fireEvent.change(screen.getByPlaceholderText(/username/i), { target: { value: 'trialuser' } });
  fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'password' } });
  fireEvent.click(screen.getByRole('button', { name: /log in/i }));

  await waitFor(() => {
    expect(screen.getByText(/your trial has expired/i)).toBeInTheDocument();
  });
});