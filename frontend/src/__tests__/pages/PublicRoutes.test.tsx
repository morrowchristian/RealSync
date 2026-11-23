// frontend/src/__tests__/pages/PublicRoutes.test.tsx
import { screen } from '@testing-library/react';
import App from '../../App';
import { renderWithProviders } from '../test-utils';

describe('Public routes without a token', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('/demo renders the read-only demo instead of redirecting to /login', async () => {
    renderWithProviders(<App />, { route: '/demo' });

    // The banner phrase is split across elements by the links, so assert
    // on the banner's full text content.
    const banner = await screen.findByText(/You're viewing a read-only demo/);
    expect(banner.closest('div')).toHaveTextContent(
      "You're viewing a read-only demo — sign up to try it yourself"
    );
    expect(screen.queryByText(/^Login$/)).not.toBeInTheDocument();
  });

  test('/signup renders the signup form instead of redirecting to /login', async () => {
    renderWithProviders(<App />, { route: '/signup' });

    expect(
      await screen.findByRole('heading', { name: /sign up/i })
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/^username$/i)).toBeInTheDocument();
  });

  test('a protected route still redirects to /login without a token', async () => {
    renderWithProviders(<App />, { route: '/leads' });

    expect(
      await screen.findByRole('heading', { name: /^Login$/ })
    ).toBeInTheDocument();
  });
});
