import { useEffect, useState } from 'react';
import { fetchLeads, fetchLead, archiveLead, deleteLead } from '../api/leads';
import { fetchCustomFields } from '../api/customFields';
import LeadForm from '../components/forms/LeadForm';
import EstimateForm from '../components/forms/EstimateForm';
import FollowUpForm from '../components/forms/FollowUpForm';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import ContactCard from '../components/ui/ContactCard';
import { toast } from 'react-toastify';
import StatusTabs from '../components/ui/StatusTabs';
import EmptyState from '../components/ui/EmptyState';
import type { Lead } from '../types/lead';
import type { CustomField } from '../types/customField';
import { fetchCurrentAgent, type AgentProfile } from '../api/agent';
import { LEAD_LIMIT } from '../utils/trial';

// Kebab (three-dot) row menu: Edit / Archive / Delete, wired to the
// page's existing handlers. Clicks stop propagation so opening the menu
// (or picking an action) does not also select the row.
function RowMenu({
  lead,
  onEdit,
  onArchive,
  onDelete,
}: {
  lead: Lead;
  onEdit: (lead: Lead) => void;
  onArchive: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        aria-label={`Actions for ${lead.full_name}`}
        data-testid={`lead-kebab-${lead.id}`}
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
          data-testid={`lead-menu-${lead.id}`}
          className="absolute right-0 z-10 mt-1 w-36 rounded-lg border border-gray-200 bg-white shadow-lg py-1"
        >
          <button
            type="button"
            data-testid={`lead-menu-edit-${lead.id}`}
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onEdit(lead);
            }}
            className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
          >
            Edit
          </button>
          <button
            type="button"
            data-testid={`lead-menu-archive-${lead.id}`}
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onArchive(lead);
            }}
            className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
          >
            Archive
          </button>
          <button
            type="button"
            data-testid={`lead-menu-delete-${lead.id}`}
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onDelete(lead);
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

export default function LeadsPage() {
  // --------------------------- State ---------------------------
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setModalOpen] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  // Which destructive action is awaiting in-app confirmation, if any.
  const [confirmAction, setConfirmAction] = useState<'archive' | 'delete' | null>(null);
  // Lead shown in the double-click contact-card modal; null = closed.
  const [cardLead, setCardLead] = useState<Lead | null>(null);
  // Lead an estimate is being created for from the contact card, if any.
  const [estimateLead, setEstimateLead] = useState<Lead | null>(null);
  // Lead a follow-up is being created for from the contact card, if any.
  const [followUpLead, setFollowUpLead] = useState<Lead | null>(null);
  // Trial accounts are capped at LEAD_LIMIT leads; null = unknown / full.
  const [isTrial, setIsTrial] = useState<boolean>(false);
  // Custom-field definitions, for labelling custom_data on the contact card.
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  // Signed-in agent, for the contact card's Owner row.
  const [currentAgent, setCurrentAgent] = useState<AgentProfile | null>(null);

  const statusOptions: string[] = ['All', 'New', 'Contacted', 'Qualified', 'Converted', 'Lost'];

  // --------------------------- Effects ---------------------------
  useEffect(() => {
    fetchLeads().then(data => setLeads(data)).finally(() => setLoading(false));
    fetchCurrentAgent().then((agent) => {
      setCurrentAgent(agent);
      setIsTrial(agent?.is_trial ?? false);
    });
    fetchCustomFields()
      .then((fields) => setCustomFields(fields.filter((f) => f.is_active)))
      .catch(() => setCustomFields([]));
  }, []);

  // --------------------------- Handlers ---------------------------
  const refetchLeads = () => fetchLeads().then(setLeads);

  const filteredLeads = leads.filter((lead) => {
    const matchesStatus =
      statusFilter === 'All' || lead.status.toLowerCase() === statusFilter.toLowerCase();
    const q = search.toLowerCase();
    const matchesSearch =
      lead.full_name.toLowerCase().includes(q) ||
      lead.email.toLowerCase().includes(q) ||
      (lead.company ?? '').toLowerCase().includes(q) ||
      lead.status.toLowerCase().includes(q) ||
      lead.id.toString().includes(search);
    return matchesStatus && matchesSearch;
  });

  // Single-click selects (highlights) the row and fetches the fresh
  // record for highlight state. It does NOT open any card.
  const handleSelectLead = (id: number): void => {
    fetchLead(id).then(setSelectedLead);
  };

  // Double-click opens the contact card in a modal.
  const handleOpenCard = (id: number): void => {
    fetchLead(id).then((lead) => {
      setSelectedLead(lead);
      setCardLead(lead);
    });
  };

  const closeCardModal = (): void => {
    setCardLead(null);
    setConfirmAction(null);
  };

  const closeModal = (): void => {
    setModalOpen(false);
    setConfirmAction(null);
  };

  const openEditModal = (lead: Lead): void => {
    setSelectedLead(lead);
    setEditMode(true);
    setModalOpen(true);
  };

  const requestArchive = (lead: Lead): void => {
    setSelectedLead(lead);
    setConfirmAction('archive');
  };

  const requestDelete = (lead: Lead): void => {
    setSelectedLead(lead);
    setConfirmAction('delete');
  };

  const handleArchive = async (): Promise<void> => {
    if (!selectedLead) return;
    try {
      await archiveLead(selectedLead.id);
      toast.success('Lead archived');
      setModalOpen(false);
      setEditMode(false);
      setConfirmAction(null);
      setSelectedLead(null);
      setCardLead(null);
      refetchLeads();
    } catch (error: unknown) {
      toast.error('Failed to archive lead');
      console.error(error);
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!selectedLead) return;
    try {
      await deleteLead(selectedLead.id);
      toast.success('Lead deleted');
      setModalOpen(false);
      setEditMode(false);
      setConfirmAction(null);
      setSelectedLead(null);
      setCardLead(null);
      refetchLeads();
    } catch (error: unknown) {
      toast.error('Failed to delete lead');
      console.error(error);
    }
  };

  const ownerName =
    cardLead && currentAgent && currentAgent.id === cardLead.agent
      ? [currentAgent.first_name, currentAgent.last_name]
          .filter(Boolean)
          .join(' ') || currentAgent.username
      : undefined;

  if (loading) return <p className="p-4">Loading leads...</p>;

  return (
    <div className="p-4 space-y-4">
      {/* Leads list — single spreadsheet view (white table card, Dribbble polish) */}
      <section className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 px-5 pt-5 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
            <p className="text-sm text-gray-500">
              Total {leads.length}
              {filteredLeads.length !== leads.length &&
                ` · ${filteredLeads.length} shown`}
            </p>
            {isTrial && (
              <p data-testid="leads-quota" className="text-sm text-gray-600">
                {leads.length} / {LEAD_LIMIT} leads
              </p>
            )}
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="Search leads by name, email, or status..."
              aria-label="Search leads"
              data-testid="leads-search"
              className="px-3 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <label className="sr-only" htmlFor="leads-filter">
              Filter by status
            </label>
            <select
              id="leads-filter"
              data-testid="leads-filter"
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-full text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status === 'All' ? 'Filter: All' : status}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                setSelectedLead(null);
                setEditMode(false);
                setModalOpen(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-full hover:bg-blue-700"
            >
              + New Lead
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

        <p className="px-5 pb-2 text-xs text-gray-400">
          Double-click a row to open the contact card.
        </p>

        {filteredLeads.length === 0 ? (
          <div className="px-5 pb-5">
            <EmptyState message="No leads found." />
          </div>
        ) : (
          <div className="overflow-x-auto pb-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-xs text-gray-500 border-y border-gray-100">
                  <th className="px-5 py-3 font-semibold">ID</th>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Company</th>
                  <th className="px-4 py-3 font-semibold">Phone</th>
                  <th className="px-4 py-3 font-semibold">Job Site Address</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Date Created</th>
                  <th className="px-4 py-3 font-semibold">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    data-testid={`lead-row-${lead.id}`}
                    onClick={() => handleSelectLead(lead.id)}
                    onDoubleClick={() => handleOpenCard(lead.id)}
                    className={`border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                      selectedLead?.id === lead.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <td className="px-5 py-4 text-sm text-gray-700">{lead.id}</td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-gray-900">{lead.full_name}</p>
                      <p className="text-sm text-gray-500">{lead.email}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700">{lead.company || '—'}</td>
                    <td className="px-4 py-4 text-sm text-gray-700">{lead.phone}</td>
                    <td className="px-4 py-4 text-sm text-gray-700">{lead.property_address}</td>
                    <td className="px-4 py-4 text-sm text-gray-700">{lead.status}</td>
                    <td className="px-4 py-4 text-sm text-gray-700">
                      {formatShortDate(lead.created_at)}
                    </td>
                    <td className="px-4 py-4">
                      <RowMenu
                        lead={lead}
                        onEdit={openEditModal}
                        onArchive={requestArchive}
                        onDelete={requestDelete}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* In-app confirm for kebab Archive/Delete (outside any modal) */}
      {confirmAction && selectedLead && !isModalOpen && !cardLead && (
        <div className="mt-4">
          <ConfirmDialog
            message={
              confirmAction === 'archive'
                ? `Archive Lead #${selectedLead.id}? The lead will move to Archived Leads and can be restored later.`
                : `Permanently delete Lead #${selectedLead.id}? This cannot be undone.`
            }
            confirmLabel={confirmAction === 'archive' ? 'Yes, archive' : 'Yes, delete'}
            variant={confirmAction === 'archive' ? 'warn' : 'danger'}
            onConfirm={confirmAction === 'archive' ? handleArchive : handleDelete}
            onCancel={() => setConfirmAction(null)}
          />
        </div>
      )}

      {/* Contact-card modal (opened by double-clicking a row) */}
      <Modal
        isOpen={cardLead !== null}
        onClose={closeCardModal}
        title={cardLead?.full_name}
      >
        {cardLead && (
          <>
            <ContactCard
              lead={cardLead}
              customFields={customFields}
              ownerName={ownerName}
              onBack={closeCardModal}
              onEdit={() => {
                const lead = cardLead;
                setCardLead(null);
                setConfirmAction(null);
                openEditModal(lead);
              }}
              onNewEstimate={() => {
                const lead = cardLead;
                setCardLead(null);
                setEstimateLead(lead);
              }}
              onAddFollowUp={() => {
                const lead = cardLead;
                setCardLead(null);
                setFollowUpLead(lead);
              }}
              onUpdated={() => {
                fetchLead(cardLead.id).then((fresh) => {
                  setSelectedLead(fresh);
                  setCardLead(fresh);
                });
                refetchLeads();
              }}
            />

            <button
              onClick={() => requestArchive(cardLead)}
              className="mt-4 px-4 py-2 bg-orange-500 text-white rounded"
            >
              🗃️ Archive Lead
            </button>
            <button
              onClick={() => requestDelete(cardLead)}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded"
            >
              ❌ Delete Lead
            </button>

            {confirmAction === 'archive' && (
              <div className="mt-4">
                <ConfirmDialog
                  message={`Archive Lead #${cardLead.id}? The lead will move to Archived Leads and can be restored later.`}
                  confirmLabel="Yes, archive"
                  variant="warn"
                  onConfirm={handleArchive}
                  onCancel={() => setConfirmAction(null)}
                />
              </div>
            )}
            {confirmAction === 'delete' && (
              <div className="mt-4">
                <ConfirmDialog
                  message={`Permanently delete Lead #${cardLead.id}? This cannot be undone.`}
                  confirmLabel="Yes, delete"
                  variant="danger"
                  onConfirm={handleDelete}
                  onCancel={() => setConfirmAction(null)}
                />
              </div>
            )}
          </>
        )}
      </Modal>

      {/* New-estimate modal (from the contact card, lead prefilled) */}
      <Modal
        isOpen={estimateLead !== null}
        onClose={() => setEstimateLead(null)}
        title="New Estimate"
      >
        {estimateLead && (
          <EstimateForm
            leads={leads}
            prefilledLeadId={estimateLead.id}
            mode="create"
            onCancel={() => setEstimateLead(null)}
            onSuccess={() => setEstimateLead(null)}
          />
        )}
      </Modal>

      {/* Add-follow-up modal (from the contact card, lead prefilled) */}
      <Modal
        isOpen={followUpLead !== null}
        onClose={() => setFollowUpLead(null)}
        title="Add follow-up"
      >
        {followUpLead && (
          <FollowUpForm
            lead={followUpLead}
            mode="create"
            onCancel={() => setFollowUpLead(null)}
            onSuccess={() => setFollowUpLead(null)}
          />
        )}
      </Modal>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editMode ? 'Edit Lead' : 'New Lead'}
      >
        <LeadForm
          initialData={editMode ? selectedLead : undefined}
          mode={editMode ? 'edit' : 'create'}
          onCancel={closeModal}
          onSuccess={() => {
            // Refresh the selected lead so the contact card and the next
            // Edit prefill show the updated values (not the stale object).
            if (editMode && selectedLead) {
              fetchLead(selectedLead.id).then(setSelectedLead);
            }
            setModalOpen(false);
            setEditMode(false);
            setConfirmAction(null);
            refetchLeads();
          }}
        />

        {editMode && selectedLead && (
          <>
            <button
              onClick={() => setConfirmAction('archive')}
              className="mt-4 px-4 py-2 bg-orange-500 text-white rounded"
            >
              🗃️ Archive Lead
            </button>
            <button
              onClick={() => setConfirmAction('delete')}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded"
            >
              ❌ Delete Lead
            </button>

            {confirmAction === 'archive' && (
              <div className="mt-4">
                <ConfirmDialog
                  message={`Archive Lead #${selectedLead.id}? The lead will move to Archived Leads and can be restored later.`}
                  confirmLabel="Yes, archive"
                  variant="warn"
                  onConfirm={handleArchive}
                  onCancel={() => setConfirmAction(null)}
                />
              </div>
            )}
            {confirmAction === 'delete' && (
              <div className="mt-4">
                <ConfirmDialog
                  message={`Permanently delete Lead #${selectedLead.id}? This cannot be undone.`}
                  confirmLabel="Yes, delete"
                  variant="danger"
                  onConfirm={handleDelete}
                  onCancel={() => setConfirmAction(null)}
                />
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}
