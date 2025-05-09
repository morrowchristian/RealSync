// frontend/src/pages/LeadsPage.tsx
import { useEffect, useState } from 'react';
import { fetchLeads, fetchLead, deleteLead } from '../api/leads';
import LeadForm from '../components/forms/LeadForm';
import Modal from '../components/ui/Modal';
import { toast } from 'react-toastify';
import api from '../api/axios';
import StatusTabs from '../components/ui/StatusTabs';


export default function LeadsPage() {
  // --------------------------- State ---------------------------
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const statusOptions = ['All', 'New', 'Contacted', 'Qualified', 'Converted', 'Lost'];
  const [statusFilter, setStatusFilter] = useState('All');


  // --------------------------- Effects ---------------------------
  useEffect(() => {
    fetchLeads().then(data => setLeads(data)).finally(() => setLoading(false));
  }, []);

  // --------------------------- Handlers ---------------------------
  const refetchLeads = () => fetchLeads().then(setLeads);

  const filteredLeads = leads.filter((lead) => {
    const matchesStatus = statusFilter === 'All' || lead.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesSearch =
      lead.full_name.toLowerCase().includes(search.toLowerCase()) ||
      lead.status.toLowerCase().includes(search.toLowerCase()) ||
      lead.id.toString().includes(search);
    return matchesStatus && matchesSearch;
  });  

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    fetchLead(id).then(setSelectedLead);
  };

  const handleArchive = async () => {
    if (!selectedLead) return;
    const confirmArchive = confirm(`Archive Lead #${selectedLead.id}?`);
    if (!confirmArchive) return;
    try {
      await api.post(`/leads/${selectedLead.id}/archive/`);
      toast.success('Lead archived');
      setModalOpen(false);
      setEditMode(false);
      setSelectedLead(null);
      refetchLeads();
    } catch (error) {
      toast.error('Failed to archive lead');
    }
  };

  if (loading) return <p className="p-4">Loading leads...</p>;

  return (
    <div className="p-4 space-y-4">
      {/* --------------------------- Controls --------------------------- */}
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

        <select
          className="w-full p-2 border rounded-md"
          onChange={handleSelect}
          defaultValue=""
        >
          <option value="" disabled>Select a lead</option>
          {filteredLeads.map((lead) => (
            <option key={lead.id} value={lead.id}>
              #{lead.id} – {lead.full_name}
            </option>
          ))}
        </select>
      </div>

      {/* --------------------------- Selected Lead Details --------------------------- */}
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

      {/* --------------------------- Lead List --------------------------- */}
      <h1 className="text-2xl font-bold mt-4">All Leads</h1>
      <ul className="space-y-2">
        {leads.map((lead) => (
          <li key={lead.id} className="p-4 bg-white rounded shadow">
            <p className="font-semibold">{lead.full_name}</p>
            <p className="text-sm text-gray-600">{lead.property_address}</p>
            <p className="text-sm text-gray-500">Status: {lead.status}</p>
          </li>
        ))}
      </ul>

      {/* --------------------------- Modal for Create/Edit --------------------------- */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        title={editMode ? 'Edit Lead' : 'New Lead'}
      >
        <LeadForm
          initialData={editMode ? selectedLead : undefined}
          mode={editMode ? 'edit' : 'create'}
          onSuccess={() => {
            setModalOpen(false);
            setEditMode(false);
            refetchLeads();
          }}
        />

        {editMode && selectedLead && (
          <button
            onClick={handleArchive}
            className="mt-4 px-4 py-2 bg-orange-500 text-white rounded"
          >
            🗃️ Archive Lead
          </button>
        )}
      </Modal>
    </div>
  );
}