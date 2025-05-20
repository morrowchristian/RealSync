// frontend/src/pages/ArchivedContractsPage.tsx
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { restoreContract, fetchContracts, deleteContract } from '../api/contracts';
import StatusTabs from '../components/ui/StatusTabs';
import type { Contract } from '../types/contract';

export default function ArchivedContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');

  const statusOptions = ['All', 'Pending', 'Signed', 'Voided'];

  const fetchArchivedContracts = async () => {
    try {
      const all = await fetchContracts(); // assumes ?all=true is handled in backend
      const archived = all.filter(c => c.is_archived);
      setContracts(archived);
    } catch {
      toast.error('Failed to load archived contracts');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (id: number) => {
    try {
      await restoreContract(id);
      toast.success('Contract restored');
      fetchArchivedContracts();
    } catch {
      toast.error('Failed to restore contract');
    }
  };

  const handleDelete = async (contract: Contract) => {
    if (contract.status === 'signed') {
      toast.warn('Signed contracts cannot be deleted.');
      return;
    }

    const confirmDelete = confirm(`Permanently delete Contract #${contract.id}?`);
    if (!confirmDelete) return;

    try {
      await deleteContract(contract.id);
      toast.success('Contract permanently deleted');
      fetchArchivedContracts();
    } catch {
      toast.error('Failed to delete contract');
    }
  };

  useEffect(() => {
    fetchArchivedContracts();
  }, []);

  const filtered = contracts.filter(
    c => statusFilter === 'All' || c.status.toLowerCase() === statusFilter.toLowerCase()
  );

  if (loading) return <p className="p-4">Loading archived contracts...</p>;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Archived Contracts</h1>

      <StatusTabs statuses={statusOptions} activeStatus={statusFilter} onSelect={setStatusFilter} />

      {filtered.length === 0 ? (
        <p className="text-gray-600">No archived contracts available.</p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((contract) => (
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
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => handleRestore(contract.id)}
                  className="px-4 py-1 bg-green-600 text-white rounded"
                >
                  ♻️ Restore
                </button>
                <button
                  onClick={() => handleDelete(contract)}
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
