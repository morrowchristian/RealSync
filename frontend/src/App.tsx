// src/App.tsx
import { Routes, Route } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import LeadsPage from './pages/LeadsPage';
import ContractsPage from './pages/ContractsPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    // --------------------------- Route Tree ---------------------------
    <Routes>
      {/* Shared layout wrapper for all nested pages */}
      <Route path="/" element={<AppLayout />}>
        {/* Individual page routes */}
        <Route path="leads" element={<LeadsPage />} />
        <Route path="contracts" element={<ContractsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}
