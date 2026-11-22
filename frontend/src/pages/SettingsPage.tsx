// frontend/src/pages/SettingsPage.tsx
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axios';
import { logout } from '../utils/auth';

interface AgentProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  brokerage: string;
}

// The backend has no /agents/me/ endpoint — the agents list/detail endpoints
// are the only user endpoints. Login stores only the access/refresh tokens,
// so the current agent is identified from the `user_id` claim in the
// SimpleJWT access token, then fetched via GET agents/{id}/.
function getCurrentUserId(): number | null {
  try {
    const token = localStorage.getItem('access');
    if (!token) return null;
    const payload = token.split('.')[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const decoded = JSON.parse(atob(padded));
    return typeof decoded.user_id === 'number' ? decoded.user_id : null;
  } catch {
    return null;
  }
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const userId = getCurrentUserId();
      if (userId === null) {
        setLoadFailed(true);
        setLoading(false);
        return;
      }
      try {
        const res = await api.get<AgentProfile>(`agents/${userId}/`);
        setProfile(res.data);
      } catch {
        setLoadFailed(true);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const fields: { label: string; value: string }[] = profile
    ? [
        { label: 'Username', value: profile.username },
        { label: 'Email', value: profile.email },
        { label: 'First name', value: profile.first_name },
        { label: 'Last name', value: profile.last_name },
        { label: 'Phone', value: profile.phone },
        { label: 'Brokerage', value: profile.brokerage },
      ]
    : [];

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Link to="/leads" className="inline-block text-blue-500 underline">
        &larr; Back to Leads
      </Link>

      {loading ? (
        <p className="text-gray-600">Loading profile...</p>
      ) : profile ? (
        <div className="p-4 bg-white rounded shadow space-y-2">
          <h2 className="text-lg font-semibold">Profile</h2>
          {fields.map((field) => (
            <p key={field.label} className="text-sm">
              <span className="font-semibold">{field.label}: </span>
              <span className="text-gray-600">{field.value || '—'}</span>
            </p>
          ))}
          <p className="text-sm text-gray-500">
            Profile editing is not yet available.
          </p>
        </div>
      ) : (
        loadFailed && (
          <p className="text-gray-600">
            Could not load your profile. Try logging out and signing in again.
          </p>
        )
      )}

      <button
        onClick={handleLogout}
        className="px-4 py-2 bg-red-600 text-white rounded"
      >
        Log Out
      </button>
    </div>
  );
}
