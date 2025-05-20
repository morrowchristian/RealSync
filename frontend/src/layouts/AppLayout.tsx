// frontend/src/layouts/AppLayout.tsx
import { Outlet, Link } from 'react-router-dom';
import { logout } from '../utils/auth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function AppLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex">
      {/* --------------------------- Sidebar --------------------------- */}
      <aside className="w-64 bg-gray-800 text-white p-6 space-y-4">
        {/* Brand title */}
        <h2 className="text-xl font-semibold">RealSync</h2>

        {/* Navigation links */}
        <nav className="flex flex-col space-y-2">
          <Link to="/leads" className="hover:underline text-gray-300 hover:text-white">
            Leads
          </Link>
          <Link to="/leads/archived" className="hover:underline text-gray-300 hover:text-white">
            Archived Leads
          </Link>
          <Link to="/contracts" className="hover:underline text-gray-300 hover:text-white">
            Contracts
          </Link>
          <Link to="/settings" className="hover:underline text-gray-300 hover:text-white">
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
      <main className="flex-1 p-8 bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
}
