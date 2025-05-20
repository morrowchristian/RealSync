import type { ReactElement } from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }: { children: ReactElement }) {
  const token = localStorage.getItem('access');
  return token ? children : <Navigate to="/login" replace />;
}
