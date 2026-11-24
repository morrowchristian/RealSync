// src/pages/DemoPage.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { fetchDemo, type DemoData } from '../api/demo';
import { extractErrorMessage } from '../utils/trial';
import Spinner from '../components/ui/Spinner';

const LEAD_STATUS_LABELS: { value: string; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'converted', label: 'Converted' },
  { value: 'lost', label: 'Lost' },
];

// Public, read-only visitor demo. Renders the dashboard / leads views
// from the sample GET /api/demo/ payload only — no New/Edit/Delete/
// Archive buttons, no forms, and no clickable lead selection.
export default function DemoPage() {
  const [demo, setDemo] = useState<DemoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    fetchDemo()
      .then(setDemo)
      .catch((err) => {
        setLoadFailed(true);
        toast.error(extractErrorMessage(err, 'Failed to load demo'));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  if (loadFailed || !demo) {
    return (
      <div className="p-4 space-y-4">
        <DemoBanner />
        <p className="text-gray-600">
          Could not load the demo. Please try again later.
        </p>
      </div>
    );
  }

  const { leads, contracts, stats } = demo;
  const recentLeads = [...leads]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime() ||
        b.id - a.id
    )
    .slice(0, 5);

  return (
    <div className="p-4 space-y-6">
      <DemoBanner />

      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded shadow">
          <p className="text-sm text-gray-500">Total Leads</p>
          <p className="text-3xl font-bold">{stats.total_leads}</p>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <p className="text-sm text-gray-500">Active Leads</p>
          <p className="text-3xl font-bold">{stats.active_leads}</p>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <p className="text-sm text-gray-500">Total Contracts</p>
          <p className="text-3xl font-bold">{stats.total_contracts}</p>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <p className="text-sm text-gray-500">Contracts Pending Signature</p>
          <p className="text-3xl font-bold">{stats.pending_signature}</p>
        </div>
      </div>

      {/* Leads by status */}
      <div className="p-4 bg-white rounded shadow">
        <h2 className="text-lg font-semibold mb-2">Leads by Status</h2>
        <ul className="space-y-1">
          {LEAD_STATUS_LABELS.map(({ value, label }) => (
            <li key={value} className="flex justify-between text-sm">
              <span>{label}</span>
              <span className="font-semibold">
                {stats.leads_by_status[value as keyof typeof stats.leads_by_status] ?? 0}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Recent leads */}
      <div className="p-4 bg-white rounded shadow">
        <h2 className="text-lg font-semibold mb-2">Recent Leads</h2>
        {recentLeads.length === 0 ? (
          <p className="text-sm text-gray-500">No leads yet.</p>
        ) : (
          <ul className="space-y-2">
            {recentLeads.map((lead) => (
              <li key={lead.id} className="flex justify-between items-center text-sm">
                <span className="font-semibold">{lead.name}</span>
                <span className="text-gray-500 capitalize">{lead.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Leads list (read-only table — rows are not clickable) */}
      <h2 className="text-2xl font-bold mt-4">All Leads</h2>
      {leads.length === 0 ? (
        <p className="text-sm text-gray-500">No leads in this demo.</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded shadow">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-sm text-gray-600">
                <th className="px-4 py-2 font-semibold">ID</th>
                <th className="px-4 py-2 font-semibold">Name</th>
                <th className="px-4 py-2 font-semibold">Email</th>
                <th className="px-4 py-2 font-semibold">Phone</th>
                <th className="px-4 py-2 font-semibold">Job Site Address</th>
                <th className="px-4 py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b border-gray-100">
                  <td className="px-4 py-2">#{lead.id}</td>
                  <td className="px-4 py-2 font-semibold">{lead.name}</td>
                  <td className="px-4 py-2">{lead.email}</td>
                  <td className="px-4 py-2">{lead.phone}</td>
                  <td className="px-4 py-2">{lead.property_address}</td>
                  <td className="px-4 py-2">{lead.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Contracts (read-only) */}
      <h2 className="text-2xl font-bold mt-4">All Contracts</h2>
      {contracts.length === 0 ? (
        <p className="text-sm text-gray-500">No contracts in this demo.</p>
      ) : (
        <ul className="space-y-2">
          {contracts.map((contract) => (
            <li key={contract.id} className="p-4 bg-white rounded shadow">
              <p className="font-semibold">Status: {contract.status}</p>
              <p className="text-sm text-gray-600">Lead: {contract.lead_name}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DemoBanner() {
  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded">
      <p className="text-sm text-blue-900">
        You&apos;re viewing a read-only demo —{' '}
        <Link to="/signup" className="text-blue-600 underline">
          sign up
        </Link>{' '}
        to try it yourself or{' '}
        <Link to="/login" className="text-blue-600 underline">
          log in
        </Link>
        .
      </p>
    </div>
  );
}
