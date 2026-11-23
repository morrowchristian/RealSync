// src/pages/DashboardPage.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchLeads } from '../api/leads';
import { fetchContracts } from '../api/contracts';
import Spinner from '../components/ui/Spinner';
import type { Lead } from '../types/lead';
import type { Contract } from '../types/contract';

const LEAD_STATUS_LABELS: { value: Lead['status']; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'converted', label: 'Converted' },
  { value: 'lost', label: 'Lost' },
];

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    Promise.all([fetchLeads(), fetchContracts()])
      .then(([leadData, contractData]) => {
        setLeads(leadData);
        setContracts(contractData);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const pendingContracts = contracts.filter((c) => c.status === 'pending').length;

  const recentLeads = [...leads]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime() ||
        b.id - a.id,
    )
    .slice(0, 5);

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded shadow">
          <p className="text-sm text-gray-500">Active Leads</p>
          <p className="text-3xl font-bold">{leads.length}</p>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <p className="text-sm text-gray-500">Total Contracts</p>
          <p className="text-3xl font-bold">{contracts.length}</p>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <p className="text-sm text-gray-500">Contracts Pending Signature</p>
          <p className="text-3xl font-bold">{pendingContracts}</p>
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
                {leads.filter((lead) => lead.status === value).length}
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
                <Link to="/leads" className="font-semibold text-blue-600 hover:underline">
                  {lead.full_name}
                </Link>
                <span className="text-gray-500 capitalize">{lead.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
