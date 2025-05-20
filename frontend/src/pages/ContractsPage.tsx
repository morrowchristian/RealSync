// frontend/src/pages/ContractsPage.tsx
import { useEffect, useState } from 'react';
import {
  fetchContracts,
  fetchContract,
} from '../api/contracts';
import { fetchLeads } from '../api/leads';
import ContractForm from '../components/forms/ContractForm';
import Modal from '../components/ui/Modal';
import StatusTabs from '../components/ui/StatusTabs';
import EmptyState from '../components/ui/EmptyState';
import Spinner from '../components/ui/Spinner';
import { toast } from 'react-toastify';
import api from '../api/axios';
import type { Contract } from '../types/contract';
import type { Lead } from '../types/lead';

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [isModalOpen, setModalOpen] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const statusOptions = ['All', 'Pending', 'Signed', 'Voided'];

  const refetchContracts = () =>
    fetchContracts()
      .then(setContracts)
      .finally(() => setLoading(false));

  useEffect(() => {
    refetchContracts();
  }, []);

  useEffect(() => {
    fetchLeads().then(setLeads);
  }, []);

  const filteredContracts = contracts.filter((contract) => {
    const matchesStatus =
      statusFilter === 'All' || contract.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesSearch =
      contract.status.toLowerCase().includes(search.toLowerCase()) ||
      contract.id.toString().includes(search);
    return matchesStatus && matchesSearch;
  });

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    fetchContract(id).then(setSelectedContract);
  };

  const handleArchive = async () => {
    if (!selectedContract) return;
    const confirmArchive = confirm(`Archive Contract #${selectedContract.id}?`);
    if (!confirmArchive) return;
    try {
      await api.post(`/contracts/${selectedContract.id}/archive/`);
      toast.success('Contract archived');
      setModalOpen(false);
      setEditMode(false);
      setSelectedContract(null);
      refetchContracts();
    } catch (error) {
      toast.error('Failed to archive contract');
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="p-4 space-y-4">
      <div className="sticky top-0 bg-white pb-2 space-y-2">
        <div className="flex gap-2">
          <button
            onClick={() => {
              setSelectedContract(null);
              setEditMode(false);
              setModalOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            + New Contract
          </button>

          {selectedContract && (
            <button
              onClick={() => {
                setEditMode(true);
                setModalOpen(true);
              }}
              className="px-4 py-2 bg-yellow-500 text-white rounded"
            >
              ✏️ Edit Contract
            </button>
          )}
        </div>

        <StatusTabs
          statuses={statusOptions}
          activeStatus={statusFilter}
          onSelect={setStatusFilter}
        />

        <input
          type="text"
          placeholder="Search contracts by ID or status..."
          className="w-full p-2 border rounded-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="w-full p-2 border rounded-md"
          onChange={handleSelect}
          defaultValue=""
        >
          <option value="" disabled>Select a contract</option>
          {filteredContracts.map((contract) => (
            <option key={contract.id} value={contract.id}>
              #{contract.id} - {contract.status}
            </option>
          ))}
        </select>
      </div>

      {selectedContract && (
        <div className="p-4 bg-gray-100 rounded shadow">
          <h2 className="text-xl font-bold mb-2">
            Contract #{selectedContract.id}
          </h2>
          <p>Status: {selectedContract.status}</p>
          <a
            href={selectedContract.document}
            className="text-blue-500 underline"
            target="_blank"
            rel="noreferrer"
          >
            View PDF
          </a>
        </div>
      )}

      <h1 className="text-2xl font-bold mt-4">All Contracts</h1>
      {filteredContracts.length === 0 ? (
        <EmptyState message="No contracts found." />
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
            </li>
          ))}
        </ul>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        title={editMode ? 'Edit Contract' : 'New Contract'}
      >
        <ContractForm
          initialData={editMode ? selectedContract : undefined}
          leads={leads}
          mode={editMode ? 'edit' : 'create'}
          onSuccess={() => {
            setModalOpen(false);
            setEditMode(false);
            refetchContracts();
          }}
        />

        {editMode && selectedContract && (
          <button
            onClick={handleArchive}
            className="mt-4 px-4 py-2 bg-orange-500 text-white rounded"
          >
            🗃️ Archive Contract
          </button>
        )}
      </Modal>
    </div>
  );
}
