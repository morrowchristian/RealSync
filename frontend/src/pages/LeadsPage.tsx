import { useEffect, useState } from 'react';
import { fetchLeads, fetchLead, archiveLead, deleteLead } from '../api/leads';
import LeadForm from '../components/forms/LeadForm';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { toast } from 'react-toastify';
import StatusTabs from '../components/ui/StatusTabs';
import EmptyState from '../components/ui/EmptyState';
import type { Lead } from '../types/lead';
import { fetchCurrentAgent } from '../api/agent';
import { LEAD_LIMIT } from '../utils/trial';

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
  // Cards or spreadsheet view for the lead list; defaults to Cards.
  const [viewMode, setViewMode] = useState<'cards' | 'sheet'>('cards');
  // Trial accounts are capped at LEAD_LIMIT leads; null = unknown / full.
  const [isTrial, setIsTrial] = useState<boolean>(false);

  const statusOptions: string[] = ['All', 'New', 'Contacted', 'Qualified', 'Converted', 'Lost'];

  // --------------------------- Effects ---------------------------
  useEffect(() => {
    fetchLeads().then(data => setLeads(data)).finally(() => setLoading(false));
    fetchCurrentAgent().then((agent) => setIsTrial(agent?.is_trial ?? false));
  }, []);

  // --------------------------- Handlers ---------------------------
  const refetchLeads = () => fetchLeads().then(setLeads);

  const filteredLeads = leads.filter((lead) => {
    const matchesStatus =
      statusFilter === 'All' || lead.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesSearch =
      lead.full_name.toLowerCase().includes(search.toLowerCase()) ||
      lead.status.toLowerCase().includes(search.toLowerCase()) ||
      lead.id.toString().includes(search);
    return matchesStatus && matchesSearch;
  });

  // Selecting a lead (clicking a card or a sheet row) fetches the fresh
  // record and shows the detail panel + Edit Lead button.
  const handleSelectLead = (id: number): void => {
    fetchLead(id).then(setSelectedLead);
  };

  const closeModal = (): void => {
    setModalOpen(false);
    setConfirmAction(null);
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
      refetchLeads();
    } catch (error: unknown) {
      toast.error('Failed to delete lead');
      console.error(error);
    }
  };

  if (loading) return <p className="p-4">Loading leads...</p>;

  return (
    <div className="p-4 space-y-4">
      {/* Controls */}
      <div className="sticky top-0 bg-white pb-2 space-y-2">
        <div className="flex gap-2">
          <button
            onClick={() => {
              setSelectedLead(null);
              setEditMode(false);
              setModalOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            + New Lead
          </button>

          {selectedLead && (
            <button
              onClick={() => {
                setEditMode(true);
                setModalOpen(true);
              }}
              className="px-4 py-2 bg-yellow-500 text-white rounded"
            >
              ✏️ Edit Lead
            </button>
          )}

          {/* Cards / Sheet view toggle */}
          <div className="ml-auto flex rounded overflow-hidden border border-gray-300">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-2 text-sm ${
                viewMode === 'cards'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Cards
            </button>
            <button
              onClick={() => setViewMode('sheet')}
              className={`px-3 py-2 text-sm ${
                viewMode === 'sheet'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Sheet
            </button>
          </div>
        </div>

        <StatusTabs
          statuses={statusOptions}
          activeStatus={statusFilter}
          onSelect={setStatusFilter}
        />

        <input
          type="text"
          placeholder="Search leads by ID, name, or status..."
          className="w-full p-2 border rounded-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Selected Lead */}
      {selectedLead && (
        <div className="p-4 bg-gray-100 rounded shadow">
          <h2 className="text-xl font-bold mb-2">
            Lead #{selectedLead.id}: {selectedLead.full_name}
          </h2>
          <p>Email: {selectedLead.email}</p>
          <p>Phone: {selectedLead.phone}</p>
          <p>Property: {selectedLead.property_address}</p>
          <p>Status: {selectedLead.status}</p>
        </div>
      )}

      {/* Lead List */}
      <h1 className="text-2xl font-bold mt-4">All Leads</h1>
      {isTrial && (
        <p data-testid="leads-quota" className="text-sm text-gray-600">
          {leads.length} / {LEAD_LIMIT} leads
        </p>
      )}
      {filteredLeads.length === 0 ? (
        <EmptyState message="No leads found." />
      ) : viewMode === 'cards' ? (
        <ul className="space-y-2">
          {filteredLeads.map((lead) => (
            <li
              key={lead.id}
              onClick={() => handleSelectLead(lead.id)}
              className={`p-4 bg-white rounded shadow cursor-pointer hover:shadow-md hover:bg-gray-50 transition ${
                selectedLead?.id === lead.id ? 'ring-2 ring-blue-600' : ''
              }`}
            >
              <p className="font-semibold">{lead.full_name}</p>
              <p className="text-sm text-gray-600">{lead.property_address}</p>
              <p className="text-sm text-gray-500">Status: {lead.status}</p>
            </li>
          ))}
        </ul>
      ) : (
        <div className="overflow-x-auto bg-white rounded shadow">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-sm text-gray-600">
                <th className="px-4 py-2 font-semibold">ID</th>
                <th className="px-4 py-2 font-semibold">Name</th>
                <th className="px-4 py-2 font-semibold">Email</th>
                <th className="px-4 py-2 font-semibold">Phone</th>
                <th className="px-4 py-2 font-semibold">Property Address</th>
                <th className="px-4 py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <tr
                  key={lead.id}
                  onClick={() => handleSelectLead(lead.id)}
                  className={`border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                    selectedLead?.id === lead.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <td className="px-4 py-2">#{lead.id}</td>
                  <td className="px-4 py-2 font-semibold">{lead.full_name}</td>
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

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editMode ? 'Edit Lead' : 'New Lead'}
      >
        <LeadForm
          initialData={editMode ? selectedLead : undefined}
          mode={editMode ? 'edit' : 'create'}
          onSuccess={() => {
            // Refresh the selected lead so the detail panel and the next
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
