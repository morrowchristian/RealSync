// frontend/src/layouts/AppLayout.tsx
import { useState } from 'react';
import { Outlet, Link, NavLink } from 'react-router-dom';
import { logout } from '../utils/auth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// Dribbble admin-panel sidebar: slate blue-grey (#1E293B), light
// icons/labels, active item highlighted in bright royal blue (#214EDF).
const navLinkClass = ({ isActive }: { isActive: boolean }): string =>
  isActive
    ? 'flex items-center gap-3 rounded-lg bg-[#214EDF] px-3 py-2 text-sm font-medium text-white'
    : 'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#9EA1A5] hover:bg-white/5 hover:text-white';

function NavIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center" aria-hidden="true">
      {children}
    </span>
  );
}

const iconProps = {
  className: 'h-5 w-5',
  fill: 'none',
  viewBox: '0 0 24 24',
  stroke: 'currentColor',
  strokeWidth: 2,
} as const;

export default function AppLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F6FBFE]">
      {/* --------------------------- Mobile top bar --------------------------- */}
      <div className="md:hidden flex items-center justify-between bg-[#1E293B] text-white p-4">
        <h2 className="text-xl font-semibold">RealSync</h2>
        <button
          onClick={() => setSidebarOpen((open) => !open)}
          className="px-3 py-1 border border-white/20 rounded text-gray-300 hover:text-white"
          aria-expanded={sidebarOpen}
          aria-label="Toggle navigation menu"
        >
          Menu
        </button>
      </div>

      {/* --------------------------- Sidebar --------------------------- */}
      <aside
        className={`${sidebarOpen ? 'block' : 'hidden'} md:block w-64 shrink-0 bg-[#1E293B] text-white p-6 space-y-4`}
      >
        {/* Brand title */}
        <Link
          to="/"
          onClick={() => setSidebarOpen(false)}
          className="flex items-center gap-3 hover:opacity-90"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#214EDF] text-sm font-bold text-white">
            R
          </span>
          <span className="text-xl font-semibold">RealSync</span>
        </Link>

        {/* Navigation links */}
        <nav className="flex flex-col space-y-1">
          <NavLink
            to="/"
            end
            onClick={() => setSidebarOpen(false)}
            className={navLinkClass}
          >
            <NavIcon>
              <svg {...iconProps}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </NavIcon>
            Dashboard
          </NavLink>
          <NavLink
            to="/leads"
            end
            onClick={() => setSidebarOpen(false)}
            className={navLinkClass}
          >
            <NavIcon>
              <svg {...iconProps}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </NavIcon>
            Leads
          </NavLink>
          <NavLink
            to="/leads/archived"
            end
            onClick={() => setSidebarOpen(false)}
            className={navLinkClass}
          >
            <NavIcon>
              <svg {...iconProps}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v12a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </NavIcon>
            Archived Leads
          </NavLink>
          <NavLink
            to="/contracts"
            end
            onClick={() => setSidebarOpen(false)}
            className={navLinkClass}
          >
            <NavIcon>
              <svg {...iconProps}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </NavIcon>
            Contracts
          </NavLink>
          <NavLink
            to="/estimates"
            end
            onClick={() => setSidebarOpen(false)}
            className={navLinkClass}
          >
            <NavIcon>
              <svg {...iconProps}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </NavIcon>
            Estimates
          </NavLink>
          <NavLink
            to="/follow-ups"
            end
            onClick={() => setSidebarOpen(false)}
            className={navLinkClass}
          >
            <NavIcon>
              <svg {...iconProps}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </NavIcon>
            Follow-ups
          </NavLink>
          <NavLink
            to="/contracts/archived"
            end
            onClick={() => setSidebarOpen(false)}
            className={navLinkClass}
          >
            <NavIcon>
              <svg {...iconProps}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
              </svg>
            </NavIcon>
            Archived Contracts
          </NavLink>
          <NavLink
            to="/settings"
            end
            onClick={() => setSidebarOpen(false)}
            className={navLinkClass}
          >
            <NavIcon>
              <svg {...iconProps}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </NavIcon>
            Settings
          </NavLink>
        </nav>

        {/* Divider */}
        <hr className="border-white/10 my-4" />

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 text-left text-sm font-medium text-red-400 hover:text-white w-full rounded-lg px-3 py-2 hover:bg-white/5"
        >
          <NavIcon>
            <svg {...iconProps}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </NavIcon>
          Log Out
        </button>
      </aside>

      {/* --------------------------- Main Content --------------------------- */}
      <main className="flex-1 p-4 md:p-8 bg-[#F6FBFE]">
        <Outlet />
      </main>
    </div>
  );
}
