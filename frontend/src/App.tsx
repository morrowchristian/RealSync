// frontend/src/App.tsx
import { Routes, Route } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import LeadsPage from './pages/LeadsPage';
import ArchivedLeadsPage from './pages/ArchivedLeadsPage';
import ContractsPage from './pages/ContractsPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import ErrorBoundary from './components/ui/ErrorBoundary';
import ProtectedRoute from './components/auth/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      {/* Public route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected route with shared layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route
          path="leads"
          element={
            <ErrorBoundary>
              <LeadsPage />
            </ErrorBoundary>
          }
        />
        <Route
          path="leads/archived"
          element={
            <ErrorBoundary>
              <ArchivedLeadsPage />
            </ErrorBoundary>
          }
        />
        <Route
          path="contracts"
          element={
            <ErrorBoundary>
              <ContractsPage />
            </ErrorBoundary>
          }
        />
        <Route
          path="settings"
          element={
            <ErrorBoundary>
              <SettingsPage />
            </ErrorBoundary>
          }
        />
      </Route>

      {/* Catch-all 404 */}
      <Route
        path="*"
        element={
          <ErrorBoundary>
            <div className="p-6 text-center">
              <h1 className="text-2xl font-bold">404 Not Found</h1>
              <p className="mt-4 text-gray-500">The page you are looking for does not exist.</p>
              <a href="/" className="mt-4 inline-block text-blue-500 underline">
                Go to Home
              </a>
            </div>
          </ErrorBoundary>
        }
      />
    </Routes>
  );
}
