// frontend/src/pages/EstimatesPage.tsx
import { useEffect, useState } from 'react';
import {
  fetchEstimates,
  fetchEstimate,
  deleteEstimate,
} from '../api/estimates';
import { fetchLeads } from '../api/leads';
import EstimateForm from '../components/forms/EstimateForm';
import FollowUpForm from '../components/forms/FollowUpForm';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EstimateCard from '../components/ui/EstimateCard';
import EmptyState from '../components/ui/EmptyState';
import Spinner from '../components/ui/Spinner';
import { toast } from 'react-toastify';
import type { Estimate } from '../types/estimate';
import { estimateStatusLabel } from '../types/estimate';
import type { Lead } from '../types/lead';
import { fetchCurrentAgent } from '../api/agent';
import { ESTIMATE_LIMIT } from '../utils/trial';

// Kebab (three-dot) row menu: Edit / Delete, wired to the page's
// existing handlers. Clicks stop propagation so opening the menu (or
// picking an action) does not also select the row.
function RowMenu({
  estimate,
  onEdit,
  onDelete,
}: {
  estimate: Estimate;
  onEdit: (estimate: Estimate) => void;
  onDelete: (estimate: Estimate) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        aria-label={`Actions for Estimate #${estimate.id}`}
        data-testid={`estimate-kebab-${estimate.id}`}
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
          data-testid={`estimate-menu-${estimate.id}`}
          className="absolute right-0 z-10 mt-1 w-36 rounded-lg border border-gray-200 bg-white shadow-lg py-1"
        >
          <button
            type="button"
            data-testid={`estimate-menu-edit-${estimate.id}`}
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onEdit(estimate);
            }}
            className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
          >
            Edit
          </button>
          <button
            type="button"
            data-testid={`estimate-menu-delete-${estimate.id}`}
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onDelete(estimate);
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

function formatAmount(value?: string | null): string {
  if (value === null || value === undefined || value === '') return '—';
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return value;
  return numeric.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });
}

export default function EstimatesPage() {
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedEstimate, setSelectedEstimate] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [isModalOpen, setModalOpen] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  // Which destructive action is awaiting in-app confirmation from a
  // kebab menu, if any.
  const [confirmAction, setConfirmAction] = useState<'delete' | null>(null);
  // Estimate shown in the double-click card modal, if any.
  const [cardEstimate, setCardEstimate] = useState<Estimate | null>(null);
  // Estimate a follow-up is being created for, if any.
  const [followUpEstimate, setFollowUpEstimate] = useState<Estimate | null>(null);
  // Trial accounts are capped at ESTIMATE_LIMIT estimates; false = full.
  const [isTrial, setIsTrial] = useState<boolean>(false);

  const refetchEstimates = () =>
    fetchEstimates()
      .then(setEstimates)
      .finally(() => setLoading(false));

  useEffect(() => {
    refetchEstimates();
    fetchCurrentAgent().then((agent) => setIsTrial(agent?.is_trial ?? false));
  }, []);

  useEffect(() => {
    fetchLeads().then(setLeads);
  }, []);

  const leadName = (leadId: number): string => {
    const lead = leads.find((l) => l.id === leadId);
    return lead ? lead.full_name : `Lead #${leadId}`;
  };

  const filteredEstimates = estimates.filter((estimate) => {
    const q = search.toLowerCase();
    return (
      estimate.title.toLowerCase().includes(q) ||
      leadName(estimate.lead).toLowerCase().includes(q) ||
      estimate.id.toString().includes(search)
    );
  });

  // Single-click selects (highlights) the row only.
  const handleSelect = (estimate: Estimate) => {
    setSelectedEstimate(estimate);
  };

  // Double-click fetches the fresh estimate and opens the card modal.
  const handleOpenCard = (id: number) => {
    fetchEstimate(id).then((estimate) => {
      setSelectedEstimate(estimate);
      setCardEstimate(estimate);
    });
  };

  const closeCardModal = () => {
    setCardEstimate(null);
  };

  const closeModal = () => {
    setModalOpen(false);
    setConfirmAction(null);
  };

  const openEditModal = (estimate: Estimate) => {
    setSelectedEstimate(estimate);
    setEditMode(true);
    setModalOpen(true);
  };

  const requestDelete = (estimate: Estimate) => {
    setSelectedEstimate(estimate);
    setConfirmAction('delete');
  };

  const handleDelete = async () => {
    if (!selectedEstimate) return;
    try {
      await deleteEstimate(selectedEstimate.id);
      toast.success('Estimate deleted');
      setModalOpen(false);
      setEditMode(false);
      setConfirmAction(null);
      setSelectedEstimate(null);
      setCardEstimate(null);
      refetchEstimates();
    } catch (error) {
      toast.error('Failed to delete estimate');
    }
  };

  // After a successful delete from the card modal: close the card modal,
  // clear selection, and refetch.
  const afterCardAction = () => {
    setCardEstimate(null);
    setSelectedEstimate(null);
    refetchEstimates();
  };

  if (loading) return <Spinner />;

  return (
    <div className="p-4 space-y-4">
      {/* Estimates list — clean white spreadsheet table (Dribbble polish) */}
      <section className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 px-5 pt-5 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">All Estimates</h1>
            <p className="text-sm text-gray-500">
              Total {estimates.length}
              {filteredEstimates.length !== estimates.length &&
                ` · ${filteredEstimates.length} shown`}
            </p>
            {isTrial && (
              <p data-testid="estimates-quota" className="text-sm text-gray-600">
                {estimates.length} / {ESTIMATE_LIMIT} estimates
              </p>
            )}
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="Search estimates by lead or title..."
              aria-label="Search estimates"
              className="px-3 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              onClick={() => {
                setSelectedEstimate(null);
                setEditMode(false);
                setModalOpen(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-full hover:bg-blue-700"
            >
              + New Estimate
            </button>
          </div>
        </div>

        {filteredEstimates.length === 0 ? (
          <div className="px-5 pb-5">
            <EmptyState message="No estimates found." />
          </div>
        ) : (
          <div className="overflow-x-auto pb-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-xs text-gray-500 border-y border-gray-100">
                  <th className="px-5 py-3 font-semibold">ID</th>
                  <th className="px-4 py-3 font-semibold">Lead</th>
                  <th className="px-4 py-3 font-semibold">Title</th>
                  <th className="px-4 py-3 font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Date Sent</th>
                  <th className="px-4 py-3 font-semibold">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredEstimates.map((estimate) => (
                  <tr
                    key={estimate.id}
                    onClick={() => handleSelect(estimate)}
                    onDoubleClick={() => handleOpenCard(estimate.id)}
                    className={`border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                      selectedEstimate?.id === estimate.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <td className="px-5 py-4 text-sm text-gray-900">#{estimate.id}</td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-gray-900">{leadName(estimate.lead)}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700">{estimate.title}</td>
                    <td className="px-4 py-4 text-sm text-gray-700">
                      {formatAmount(estimate.amount)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700">
                      {estimateStatusLabel(estimate.status)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700">
                      {formatShortDate(estimate.date_sent)}
                    </td>
                    <td className="px-4 py-4">
                      <RowMenu
                        estimate={estimate}
                        onEdit={openEditModal}
                        onDelete={requestDelete}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="px-5 pt-3 pb-1 text-xs text-gray-400">
              Double-click a row to open the estimate card.
            </p>
          </div>
        )}
      </section>

      {/* In-app confirm for kebab Delete (outside the modal) */}
      {confirmAction && selectedEstimate && !isModalOpen && !cardEstimate && (
        <div className="mt-4">
          <ConfirmDialog
            message={`Permanently delete Estimate #${selectedEstimate.id}? This cannot be undone.`}
            confirmLabel="Yes, delete"
            variant="danger"
            onConfirm={handleDelete}
            onCancel={() => setConfirmAction(null)}
          />
        </div>
      )}

      {/* Double-click card modal */}
      <Modal
        isOpen={cardEstimate !== null}
        onClose={closeCardModal}
        title={cardEstimate ? `Estimate #${cardEstimate.id}` : 'Estimate'}
      >
        {cardEstimate && (
          <EstimateCard
            estimate={cardEstimate}
            leadName={leadName(cardEstimate.lead)}
            onEdit={() => {
              const estimate = cardEstimate;
              closeCardModal();
              openEditModal(estimate);
            }}
            onDeleted={afterCardAction}
            onAddFollowUp={() => {
              const estimate = cardEstimate;
              closeCardModal();
              setFollowUpEstimate(estimate);
            }}
          />
        )}
      </Modal>

      {/* Add-follow-up modal (from the estimate card) */}
      <Modal
        isOpen={followUpEstimate !== null}
        onClose={() => setFollowUpEstimate(null)}
        title="Add follow-up"
      >
        {followUpEstimate && (
          <FollowUpForm
            estimate={followUpEstimate}
            lead={leads.find((l) => l.id === followUpEstimate.lead) ?? null}
            mode="create"
            onCancel={() => setFollowUpEstimate(null)}
            onSuccess={() => setFollowUpEstimate(null)}
          />
        )}
      </Modal>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editMode ? 'Edit Estimate' : 'New Estimate'}
      >
        <EstimateForm
          initialData={editMode ? selectedEstimate ?? undefined : undefined}
          leads={leads}
          mode={editMode ? 'edit' : 'create'}
          onCancel={closeModal}
          onSuccess={() => {
            // Refresh the selected estimate so the next Edit prefill shows
            // the updated values (not the stale object).
            if (editMode && selectedEstimate) {
              fetchEstimate(selectedEstimate.id).then(setSelectedEstimate);
            }
            setModalOpen(false);
            setEditMode(false);
            setConfirmAction(null);
            refetchEstimates();
          }}
        />
      </Modal>
    </div>
  );
}
