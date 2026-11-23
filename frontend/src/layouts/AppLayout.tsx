// frontend/src/layouts/AppLayout.tsx
import { useState } from 'react';
import { Outlet, Link, NavLink } from 'react-router-dom';
import { logout } from '../utils/auth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// Active nav link: highlighted background; inactive: muted text.
const navLinkClass = ({ isActive }: { isActive: boolean }): string =>
  isActive
    ? 'bg-gray-700 text-white rounded px-2 py-1'
    : 'text-gray-300 hover:text-white px-2 py-1';

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
        <Link
          to="/"
          onClick={() => setSidebarOpen(false)}
          className="text-xl font-semibold hover:text-gray-300"
        >
          RealSync
        </Link>

        {/* Navigation links */}
        <nav className="flex flex-col space-y-2">
          <NavLink
            to="/"
            end
            onClick={() => setSidebarOpen(false)}
            className={navLinkClass}
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/leads"
            end
            onClick={() => setSidebarOpen(false)}
            className={navLinkClass}
          >
            Leads
          </NavLink>
          <NavLink
            to="/leads/archived"
            end
            onClick={() => setSidebarOpen(false)}
            className={navLinkClass}
          >
            Archived Leads
          </NavLink>
          <NavLink
            to="/contracts"
            end
            onClick={() => setSidebarOpen(false)}
            className={navLinkClass}
          >
            Contracts
          </NavLink>
          <NavLink
            to="/contracts/archived"
            end
            onClick={() => setSidebarOpen(false)}
            className={navLinkClass}
          >
            Archived Contracts
          </NavLink>
          <NavLink
            to="/settings"
            end
            onClick={() => setSidebarOpen(false)}
            className={navLinkClass}
          >
            Settings
          </NavLink>
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
