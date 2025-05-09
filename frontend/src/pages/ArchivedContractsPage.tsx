// src/pages/ArchivedContractsPage.tsx
import { useEffect, useState } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import StatusTabs from '../components/ui/StatusTabs';

export default function ArchivedContractsPage() {
  // --------------------------- State ---------------------------
  const [archivedContracts, setArchivedContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');

  const statusOptions = ['All', 'Pending', 'Signed', 'Voided'];

  // --------------------------- Data Fetching ---------------------------
  const fetchArchivedContracts = async () => {
    try {
      const allContracts = await api.get('contracts/?all=true');
      const filtered = allContracts.data.filter((c: any) => c.is_archived);
      setArchivedContracts(filtered);
    } catch (err) {
      toast.error('Failed to load archived contracts');
    } finally {
      setLoading(false);
    }
  };

  // --------------------------- Delete Handler ---------------------------
  const handleDelete = async (contract: any) => {
    if (contract.status === 'signed') {
      toast.warn('Signed contracts cannot be deleted.');
      return;
    }

    const confirmDelete = confirm(`Permanently delete Contract #${contract.id}? This cannot be undone.`);
    if (!confirmDelete) return;

    try {
      await api.delete(`/contracts/${contract.id}/`);
      toast.success('Contract permanently deleted');
      fetchArchivedContracts();
    } catch (err) {
      toast.error('Failed to delete contract');
    }
  };

  // --------------------------- Effects ---------------------------
  useEffect(() => {
    fetchArchivedContracts();
  }, []);

  const filteredContracts = archivedContracts.filter((c) => {
    return statusFilter === 'All' || c.status.toLowerCase() === statusFilter.toLowerCase();
  });

  // --------------------------- UI Render ---------------------------
  if (loading) return <p className="p-4">Loading archived contracts...</p>;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Archived Contracts</h1>

      {/* ✅ Status Tabs */}
      <StatusTabs
        statuses={statusOptions}
        activeStatus={statusFilter}
        onSelect={setStatusFilter}
      />

      {filteredContracts.length === 0 ? (
        <p className="text-gray-600">No archived contracts available.</p>
      ) : (
        <ul className="space-y-2">
          {filteredContracts.map((contract) => (
            <li key={contract.id} className="p-4 bg-white rounded shadow">
              <p className="font-semibold">Status: {contract.status}</p>
              <p className="text-sm text-gray-600">Lead ID: {contract.lead}</p>
              <a
                href={contract.document}
                className="text-blue-500 underline"
                target="_blank"
                rel="noreferrer"
              >
                View PDF
              </a>
              <button
                onClick={() => handleDelete(contract)}
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
