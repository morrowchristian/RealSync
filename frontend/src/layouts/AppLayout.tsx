// frontend/src/layouts/AppLayout.tsx
import { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { logout } from '../utils/auth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function AppLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* --------------------------- Mobile top bar --------------------------- */}
      <div className="md:hidden flex items-center justify-between bg-gray-800 text-white p-4">
        <h2 className="text-xl font-semibold">RealSync</h2>
        <button
          onClick={() => setSidebarOpen((open) => !open)}
          className="px-3 py-1 border border-gray-600 rounded text-gray-300 hover:text-white"
          aria-expanded={sidebarOpen}
          aria-label="Toggle navigation menu"
        >
          Menu
        </button>
      </div>

      {/* --------------------------- Sidebar --------------------------- */}
      <aside
        className={`${sidebarOpen ? 'block' : 'hidden'} md:block w-64 shrink-0 bg-gray-800 text-white p-6 space-y-4`}
      >
        {/* Brand title */}
        <h2 className="text-xl font-semibold">RealSync</h2>

        {/* Navigation links */}
        <nav className="flex flex-col space-y-2">
          <Link
            to="/leads"
            onClick={() => setSidebarOpen(false)}
            className="hover:underline text-gray-300 hover:text-white"
          >
            Leads
          </Link>
          <Link
            to="/leads/archived"
            onClick={() => setSidebarOpen(false)}
            className="hover:underline text-gray-300 hover:text-white"
          >
            Archived Leads
          </Link>
          <Link
            to="/contracts"
            onClick={() => setSidebarOpen(false)}
            className="hover:underline text-gray-300 hover:text-white"
          >
            Contracts
          </Link>
          <Link
            to="/contracts/archived"
            onClick={() => setSidebarOpen(false)}
            className="hover:underline text-gray-300 hover:text-white"
          >
            Archived Contracts
          </Link>
          <Link
            to="/settings"
            onClick={() => setSidebarOpen(false)}
            className="hover:underline text-gray-300 hover:text-white"
          >
            Settings
          </Link>
        </nav>

        {/* Divider */}
        <hr className="border-gray-600 my-4" />

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="text-left text-red-400 hover:text-white hover:underline w-full"
        >
          Log Out
        </button>
      </aside>

      {/* --------------------------- Main Content --------------------------- */}
      <main className="flex-1 p-4 md:p-8 bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
}
