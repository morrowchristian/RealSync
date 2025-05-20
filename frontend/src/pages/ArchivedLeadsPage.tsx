// src/pages/ArchivedLeadsPage.tsx
import { useEffect, useState } from 'react';
import { fetchAllLeads, restoreLead, deleteLead } from '../api/leads';
import { toast } from 'react-toastify';
import StatusTabs from '../components/ui/StatusTabs';
import type { Lead } from '../types/lead';

export default function ArchivedLeadsPage() {
  // --------------------------- State ---------------------------
  const [archivedLeads, setArchivedLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');

  const statusOptions = ['All', 'New', 'Contacted', 'Qualified', 'Converted', 'Lost'];

  // --------------------------- Data Fetching ---------------------------
  const fetchArchivedLeads = async () => {
    try {
      const all = await fetchAllLeads();
      const filtered = all.filter((lead) => lead.is_archived);
      setArchivedLeads(filtered);
    } catch {
      toast.error('Failed to load archived leads');
    } finally {
      setLoading(false);
    }
  };

  // --------------------------- Actions ---------------------------
  const handleDelete = async (id: number) => {
    const confirmDelete = confirm(`Permanently delete Lead #${id}? This cannot be undone.`);
    if (!confirmDelete) return;

    try {
      await deleteLead(id);
      toast.success('Lead permanently deleted');
      fetchArchivedLeads();
    } catch {
      toast.error('Failed to delete lead');
    }
  };

  const handleRestore = async (id: number) => {
    try {
      await restoreLead(id);
      toast.success('Lead restored');
      fetchArchivedLeads();
    } catch {
      toast.error('Failed to restore lead');
    }
  };

  // --------------------------- Effects ---------------------------
  useEffect(() => {
    fetchArchivedLeads();
  }, []);

  const filteredLeads = archivedLeads.filter((lead) => {
    return statusFilter === 'All' || lead.status.toLowerCase() === statusFilter.toLowerCase();
  });

  // --------------------------- UI Render ---------------------------
  if (loading) return <p className="p-4">Loading archived leads...</p>;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Archived Leads</h1>

      <StatusTabs statuses={statusOptions} activeStatus={statusFilter} onSelect={setStatusFilter} />

      {filteredLeads.length === 0 ? (
        <p className="text-gray-600">No archived leads available.</p>
      ) : (
        <ul className="space-y-2">
          {filteredLeads.map((lead) => (
            <li key={lead.id} className="p-4 bg-white rounded shadow">
              <p className="font-semibold">{lead.full_name}</p>
              <p className="text-sm text-gray-600">{lead.property_address}</p>
              <p className="text-sm text-gray-500">Status: {lead.status}</p>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => handleRestore(lead.id)}
                  className="px-4 py-1 bg-green-600 text-white rounded"
                >
                  ♻️ Restore
                </button>
                <button
                  onClick={() => handleDelete(lead.id)}
                  className="px-4 py-1 bg-red-600 text-white rounded"
                >
                  Delete Permanently
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
