// frontend/src/pages/ContractsPage.tsx
import { useEffect, useState } from 'react';
import {
  fetchContracts,
  fetchContract,
  archiveContract,
  deleteContract,
} from '../api/contracts';
import { fetchLeads } from '../api/leads';
import ContractForm from '../components/forms/ContractForm';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import ContractCard from '../components/ui/ContractCard';
import StatusTabs from '../components/ui/StatusTabs';
import EmptyState from '../components/ui/EmptyState';
import Spinner from '../components/ui/Spinner';
import { toast } from 'react-toastify';
import type { Contract } from '../types/contract';
import type { Lead } from '../types/lead';
import { fetchCurrentAgent } from '../api/agent';
import { CONTRACT_LIMIT } from '../utils/trial';

// Kebab (three-dot) row menu: Edit / Archive / Delete, wired to the
// page's existing handlers. Clicks stop propagation so opening the menu
// (or picking an action) does not also select the row.
function RowMenu({
  contract,
  onEdit,
  onArchive,
  onDelete,
}: {
  contract: Contract;
  onEdit: (contract: Contract) => void;
  onArchive: (contract: Contract) => void;
  onDelete: (contract: Contract) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        aria-label={`Actions for Contract #${contract.id}`}
        data-testid={`contract-kebab-${contract.id}`}
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className="px-2 py-1 text-lg leading-none text-gray-500 rounded hover:bg-gray-100"
      >
        ⋮
      </button>
      {open && (
        <div
          data-testid={`contract-menu-${contract.id}`}
          className="absolute right-0 z-10 mt-1 w-36 rounded-lg border border-gray-200 bg-white shadow-lg py-1"
        >
          <button
            type="button"
            data-testid={`contract-menu-edit-${contract.id}`}
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onEdit(contract);
            }}
            className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
          >
            Edit
          </button>
          <button
            type="button"
            data-testid={`contract-menu-archive-${contract.id}`}
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onArchive(contract);
            }}
            className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
          >
            Archive
          </button>
          <button
            type="button"
            data-testid={`contract-menu-delete-${contract.id}`}
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onDelete(contract);
            }}
            className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

function formatShortDate(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [isModalOpen, setModalOpen] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  // Whether the in-app archive confirmation is showing (edit modal).
  const [confirmArchive, setConfirmArchive] = useState<boolean>(false);
  // Which destructive action is awaiting in-app confirmation from a
  // kebab menu, if any.
  const [confirmAction, setConfirmAction] = useState<'archive' | 'delete' | null>(null);
  // Contract shown in the double-click card modal, if any.
  const [cardContract, setCardContract] = useState<Contract | null>(null);
  // Trial accounts are capped at CONTRACT_LIMIT contracts; false = full.
  const [isTrial, setIsTrial] = useState<boolean>(false);

  const statusOptions = ['All', 'Pending', 'Signed', 'Voided'];

  const refetchContracts = () =>
    fetchContracts()
      .then(setContracts)
      .finally(() => setLoading(false));

  useEffect(() => {
    refetchContracts();
    fetchCurrentAgent().then((agent) => setIsTrial(agent?.is_trial ?? false));
  }, []);

  useEffect(() => {
    fetchLeads().then(setLeads);
  }, []);

  const leadName = (leadId: number): string => {
    const lead = leads.find((l) => l.id === leadId);
    return lead ? lead.full_name : `Lead #${leadId}`;
  };

  const filteredContracts = contracts.filter((contract) => {
    const matchesStatus =
      statusFilter === 'All' || contract.status.toLowerCase() === statusFilter.toLowerCase();
    const q = search.toLowerCase();
    const matchesSearch =
      contract.status.toLowerCase().includes(q) ||
      contract.id.toString().includes(search) ||
      leadName(contract.lead).toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  // Single-click selects (highlights) the row only.
  const handleSelect = (contract: Contract) => {
    setSelectedContract(contract);
  };

  // Double-click fetches the fresh contract and opens the card modal.
  const handleOpenCard = (id: number) => {
    fetchContract(id).then((contract) => {
      setSelectedContract(contract);
      setCardContract(contract);
    });
  };

  const closeCardModal = () => {
    setCardContract(null);
  };

  const closeModal = () => {
    setModalOpen(false);
    setConfirmArchive(false);
  };

  const openEditModal = (contract: Contract) => {
    setSelectedContract(contract);
    setEditMode(true);
    setModalOpen(true);
  };

  const requestArchive = (contract: Contract) => {
    setSelectedContract(contract);
    setConfirmAction('archive');
  };

  const requestDelete = (contract: Contract) => {
    if (contract.status === 'signed') {
      toast.warn('Signed contracts cannot be deleted.');
      return;
    }
    setSelectedContract(contract);
    setConfirmAction('delete');
  };

  const handleArchive = async () => {
    if (!selectedContract) return;
    try {
      await archiveContract(selectedContract.id);
      toast.success('Contract archived');
      setModalOpen(false);
      setEditMode(false);
      setConfirmArchive(false);
      setConfirmAction(null);
      setSelectedContract(null);
      refetchContracts();
    } catch (error) {
      toast.error('Failed to archive contract');
    }
  };

  const handleDelete = async () => {
    if (!selectedContract) return;
    if (selectedContract.status === 'signed') {
      toast.warn('Signed contracts cannot be deleted.');
      setConfirmAction(null);
      return;
    }
    try {
      await deleteContract(selectedContract.id);
      toast.success('Contract permanently deleted');
      setModalOpen(false);
      setEditMode(false);
      setConfirmAction(null);
      setSelectedContract(null);
      refetchContracts();
    } catch (error) {
      toast.error('Failed to delete contract');
    }
  };

  // After a successful archive/delete from the card modal: close the card
  // modal, clear selection, and refetch.
  const afterCardAction = () => {
    setCardContract(null);
    setSelectedContract(null);
    refetchContracts();
  };

  if (loading) return <Spinner />;

  return (
    <div className="p-4 space-y-4">
      {/* Contracts list — clean white spreadsheet table (Dribbble polish) */}
      <section className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 px-5 pt-5 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">All Contracts</h1>
            <p className="text-sm text-gray-500">
              Total {contracts.length}
              {filteredContracts.length !== contracts.length &&
                ` · ${filteredContracts.length} shown`}
            </p>
            {isTrial && (
              <p data-testid="contracts-quota" className="text-sm text-gray-600">
                {contracts.length} / {CONTRACT_LIMIT} contracts
              </p>
            )}
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="Search contracts by ID or status..."
              aria-label="Search contracts"
              className="px-3 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              onClick={() => {
                setSelectedContract(null);
                setEditMode(false);
                setModalOpen(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-full hover:bg-blue-700"
            >
              + New Contract
            </button>
          </div>
        </div>

        <div className="px-5 pb-2">
          <StatusTabs
            statuses={statusOptions}
            activeStatus={statusFilter}
            onSelect={setStatusFilter}
          />
        </div>

        {filteredContracts.length === 0 ? (
          <div className="px-5 pb-5">
            <EmptyState message="No contracts found." />
          </div>
        ) : (
          <div className="overflow-x-auto pb-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-xs text-gray-500 border-y border-gray-100">
                  <th className="px-5 py-3 font-semibold">ID</th>
                  <th className="px-4 py-3 font-semibold">Lead</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Document</th>
                  <th className="px-4 py-3 font-semibold">Date Created</th>
                  <th className="px-4 py-3 font-semibold">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredContracts.map((contract) => (
                  <tr
                    key={contract.id}
                    onClick={() => handleSelect(contract)}
                    onDoubleClick={() => handleOpenCard(contract.id)}
                    className={`border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                      selectedContract?.id === contract.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <td className="px-5 py-4 text-sm text-gray-900">#{contract.id}</td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-gray-900">{leadName(contract.lead)}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700">{contract.status}</td>
                    <td className="px-4 py-4 text-sm">
                      <a
                        href={contract.document}
                        className="text-blue-500 underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        View PDF
                      </a>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700">
                      {formatShortDate(contract.created_at)}
                    </td>
                    <td className="px-4 py-4">
                      <RowMenu
                        contract={contract}
                        onEdit={openEditModal}
                        onArchive={requestArchive}
                        onDelete={requestDelete}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="px-5 pt-3 pb-1 text-xs text-gray-400">
              Double-click a row to open the contract card.
            </p>
          </div>
        )}
      </section>

      {/* In-app confirm for kebab Archive/Delete (outside the modal) */}
      {confirmAction && selectedContract && !isModalOpen && !cardContract && (
        <div className="mt-4">
          <ConfirmDialog
            message={
              confirmAction === 'archive'
                ? `Archive Contract #${selectedContract.id}? The contract will move to Archived Contracts and can be restored later.`
                : `Permanently delete Contract #${selectedContract.id}? This cannot be undone.`
            }
            confirmLabel={confirmAction === 'archive' ? 'Yes, archive' : 'Yes, delete'}
            variant={confirmAction === 'archive' ? 'warn' : 'danger'}
            onConfirm={confirmAction === 'archive' ? handleArchive : handleDelete}
            onCancel={() => setConfirmAction(null)}
          />
        </div>
      )}

      {/* Double-click card modal */}
      <Modal
        isOpen={cardContract !== null}
        onClose={closeCardModal}
        title={cardContract ? `Contract #${cardContract.id}` : 'Contract'}
      >
        {cardContract && (
          <ContractCard
            contract={cardContract}
            leadName={leadName(cardContract.lead)}
            onEdit={() => {
              const contract = cardContract;
              closeCardModal();
              openEditModal(contract);
            }}
            onArchived={afterCardAction}
            onDeleted={afterCardAction}
          />
        )}
      </Modal>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editMode ? 'Edit Contract' : 'New Contract'}
      >
        <ContractForm
          initialData={editMode ? selectedContract : undefined}
          leads={leads}
          mode={editMode ? 'edit' : 'create'}
          onSuccess={() => {
            // Refresh the selected contract so the next Edit prefill shows
            // the updated values (not the stale object).
            if (editMode && selectedContract) {
              fetchContract(selectedContract.id).then(setSelectedContract);
            }
            setModalOpen(false);
            setEditMode(false);
            setConfirmArchive(false);
            refetchContracts();
          }}
        />

        {editMode && selectedContract && (
          <>
            <button
              onClick={() => setConfirmArchive(true)}
              className="mt-4 px-4 py-2 bg-orange-500 text-white rounded"
            >
              🗃️ Archive Contract
            </button>

            {confirmArchive && (
              <div className="mt-4">
                <ConfirmDialog
                  message={`Archive Contract #${selectedContract.id}? The contract will move to Archived Contracts and can be restored later.`}
                  confirmLabel="Yes, archive"
                  variant="warn"
                  onConfirm={handleArchive}
                  onCancel={() => setConfirmArchive(false)}
                />
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}
