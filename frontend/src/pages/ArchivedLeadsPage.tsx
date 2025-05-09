// src/pages/ArchivedLeadsPage.tsx
import { useEffect, useState } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import StatusTabs from '../components/ui/StatusTabs';

export default function ArchivedLeadsPage() {
  // --------------------------- State ---------------------------
  const [archivedLeads, setArchivedLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');

  const statusOptions = ['All', 'New', 'Contacted', 'Qualified', 'Converted', 'Lost'];

  // --------------------------- Data Fetching ---------------------------
  const fetchArchivedLeads = async () => {
    try {
      const allLeads = await api.get('leads/?all=true');
      const filtered = allLeads.data.filter((lead: any) => lead.is_archived);
      setArchivedLeads(filtered);
    } catch (err) {
      toast.error('Failed to load archived leads');
    } finally {
      setLoading(false);
    }
  };

  // --------------------------- Delete Handler ---------------------------
  const handleDelete = async (id: number) => {
    const confirmDelete = confirm(`Permanently delete Lead #${id}? This cannot be undone.`);
    if (!confirmDelete) return;

    try {
      await api.delete(`/leads/${id}/`);
      toast.success('Lead permanently deleted');
      fetchArchivedLeads();
    } catch (err) {
      toast.error('Failed to delete lead');
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

      {/* ✅ Status Tabs */}
      <StatusTabs
        statuses={statusOptions}
        activeStatus={statusFilter}
        onSelect={setStatusFilter}
      />

      {filteredLeads.length === 0 ? (
        <p className="text-gray-600">No archived leads available.</p>
      ) : (
        <ul className="space-y-2">
          {filteredLeads.map((lead) => (
            <li key={lead.id} className="p-4 bg-white rounded shadow">
              <p className="font-semibold">{lead.full_name}</p>
              <p className="text-sm text-gray-600">{lead.property_address}</p>
              <p className="text-sm text-gray-500">Status: {lead.status}</p>
              <button
                onClick={() => handleDelete(lead.id)}
                className="mt-2 px-4 py-1 bg-red-600 text-white rounded"
              >
                Delete Permanently
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
