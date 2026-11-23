// frontend/src/__tests__/pages/DashboardToday.test.tsx
import { screen, within } from '@testing-library/react';
import { rest } from 'msw';
import DashboardPage from '../../pages/DashboardPage';
import { renderWithProviders } from '../test-utils';
import { server } from '../../mocks/server';

// Default MSW handlers return 4 follow-ups (1 due today, 1 overdue,
// 1 due tomorrow, 1 already done) and 2 estimates (1 sent, 1 won).

const dueDateText = (iso: string) => {
  const [year, month, day] = iso.split('-');
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return `${months[Number(month) - 1]} ${Number(day)}, ${year}`;
};
const todayIso = () => new Date().toISOString().split('T')[0];
const yesterdayIso = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
};

test('Today lists due-today and overdue follow-ups with lead names and due dates', async () => {
  renderWithProviders(<DashboardPage />);

  const today = await screen.findByTestId('dashboard-today');
  expect(within(today).getByText('Today')).toBeInTheDocument();

  // Due today.
  expect(
    within(today).getByText('Call John about kitchen quote')
  ).toBeInTheDocument();
  expect(
    within(today)
      .getByText('Call John about kitchen quote')
      .closest('li')
  ).toHaveTextContent(dueDateText(todayIso()));
  // Overdue, flagged as such.
  expect(
    within(today).getByText('Email Jane the service agreement')
  ).toBeInTheDocument();
  expect(within(today).getByText(/Overdue/)).toBeInTheDocument();
  expect(
    within(today)
      .getByText('Email Jane the service agreement')
      .closest('li')
  ).toHaveTextContent(dueDateText(yesterdayIso()));
  // Lead names resolve.
  expect(within(today).getByText('John Doe')).toBeInTheDocument();
  expect(within(today).getByText('Jane Smith')).toBeInTheDocument();
  // Links go to the leads list.
  expect(
    within(today).getByRole('link', { name: 'Call John about kitchen quote' })
  ).toHaveAttribute('href', '/leads');

  // Not due yet, and already done, stay out of Today.
  expect(
    within(today).queryByText('Send invoice to John')
  ).not.toBeInTheDocument();
  expect(
    within(today).queryByText('Already done follow-up')
  ).not.toBeInTheDocument();
});

test('Today shows the count of estimates still awaiting follow-up', async () => {
  renderWithProviders(<DashboardPage />);

  const today = await screen.findByTestId('dashboard-today');
  // 1 sent estimate (the won one does not count).
  expect(within(today).getByText('Estimates awaiting follow-up: 1')).toBeInTheDocument();
});

test('Today shows an empty state and a zero count when nothing is due', async () => {
  server.use(
    rest.get('http://localhost:8000/api/follow-ups/', (_req, res, ctx) =>
      res(ctx.status(200), ctx.json([]))
    ),
    rest.get('http://localhost:8000/api/estimates/', (_req, res, ctx) =>
      res(ctx.status(200), ctx.json([]))
    ),
  );

  renderWithProviders(<DashboardPage />);

  const today = await screen.findByTestId('dashboard-today');
  expect(within(today).getByText('Nothing due today.')).toBeInTheDocument();
  expect(
    within(today).getByText('Estimates awaiting follow-up: 0')
  ).toBeInTheDocument();
});
