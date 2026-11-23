// frontend/src/pages/FollowUpsPage.tsx
import { useEffect, useState } from 'react';
import {
  fetchFollowUps,
  deleteFollowUp,
  toggleFollowUp,
} from '../api/followUps';
import { fetchLeads } from '../api/leads';
import FollowUpForm from '../components/forms/FollowUpForm';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import Spinner from '../components/ui/Spinner';
import { toast } from 'react-toastify';
import type { FollowUp } from '../types/followUp';
import type { Lead } from '../types/lead';

// Kebab (three-dot) row menu: Mark done / Undo, Edit, Delete, wired to
// the page's existing handlers. Clicks stop propagation so opening the
// menu (or picking an action) does not also select the row.
function RowMenu({
  followUp,
  onToggle,
  onEdit,
  onDelete,
}: {
  followUp: FollowUp;
  onToggle: (followUp: FollowUp) => void;
  onEdit: (followUp: FollowUp) => void;
  onDelete: (followUp: FollowUp) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        aria-label={`Actions for ${followUp.title}`}
        data-testid={`follow-up-kebab-${followUp.id}`}
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
          data-testid={`follow-up-menu-${followUp.id}`}
          className="absolute right-0 z-10 mt-1 w-36 rounded-lg border border-gray-200 bg-white shadow-lg py-1"
        >
          <button
            type="button"
            data-testid={`follow-up-menu-toggle-${followUp.id}`}
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onToggle(followUp);
            }}
            className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
          >
            {followUp.completed ? 'Mark not done' : 'Mark done'}
          </button>
          <button
            type="button"
            data-testid={`follow-up-menu-edit-${followUp.id}`}
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onEdit(followUp);
            }}
            className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
          >
            Edit
          </button>
          <button
            type="button"
            data-testid={`follow-up-menu-delete-${followUp.id}`}
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onDelete(followUp);
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

export default function FollowUpsPage() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUp | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [isModalOpen, setModalOpen] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  // Which destructive action is awaiting in-app confirmation from a
  // kebab menu, if any.
  const [confirmAction, setConfirmAction] = useState<'delete' | null>(null);

  const refetchFollowUps = () =>
    fetchFollowUps()
      .then(setFollowUps)
      .finally(() => setLoading(false));

  useEffect(() => {
    refetchFollowUps();
  }, []);

  useEffect(() => {
    fetchLeads().then(setLeads);
  }, []);

  const leadName = (leadId: number | null): string => {
    if (leadId === null) return '—';
    const lead = leads.find((l) => l.id === leadId);
    return lead ? lead.full_name : `Lead #${leadId}`;
  };

  const filteredFollowUps = followUps.filter((followUp) => {
    const q = search.toLowerCase();
    return (
      followUp.title.toLowerCase().includes(q) ||
      leadName(followUp.lead).toLowerCase().includes(q)
    );
  });

  // Single-click selects (highlights) the row only.
  const handleSelect = (followUp: FollowUp) => {
    setSelectedFollowUp(followUp);
  };

  const closeModal = () => {
    setModalOpen(false);
    setConfirmAction(null);
  };

  const openEditModal = (followUp: FollowUp) => {
    setSelectedFollowUp(followUp);
    setEditMode(true);
    setModalOpen(true);
  };

  const requestDelete = (followUp: FollowUp) => {
    setSelectedFollowUp(followUp);
    setConfirmAction('delete');
  };

  const handleToggle = async (followUp: FollowUp) => {
    try {
      const updated = await toggleFollowUp(followUp.id, !followUp.completed);
      // Optimistic local update: the list reflects the new state at once.
      setFollowUps((prev) =>
        prev.map((item) =>
          item.id === followUp.id
            ? { ...item, completed: updated.completed ?? !followUp.completed }
            : item
        )
      );
      toast.success(
        updated.completed ?? !followUp.completed
          ? 'Follow-up marked done'
          : 'Follow-up marked not done'
      );
    } catch (error) {
      toast.error('Failed to update follow-up');
    }
  };

  const handleDelete = async () => {
    if (!selectedFollowUp) return;
    try {
      await deleteFollowUp(selectedFollowUp.id);
      toast.success('Follow-up deleted');
      setModalOpen(false);
      setEditMode(false);
      setConfirmAction(null);
      setSelectedFollowUp(null);
      refetchFollowUps();
    } catch (error) {
      toast.error('Failed to delete follow-up');
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="p-4 space-y-4">
      {/* Follow-ups list — clean white spreadsheet table (Dribbble polish) */}
      <section className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 px-5 pt-5 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Follow-ups</h1>
            <p className="text-sm text-gray-500">
              Total {followUps.length}
              {filteredFollowUps.length !== followUps.length &&
                ` · ${filteredFollowUps.length} shown`}
            </p>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="Search follow-ups by title or lead..."
              aria-label="Search follow-ups"
              className="px-3 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              onClick={() => {
                setSelectedFollowUp(null);
                setEditMode(false);
                setModalOpen(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-full hover:bg-blue-700"
            >
              + New Follow-up
            </button>
          </div>
        </div>

        {filteredFollowUps.length === 0 ? (
          <div className="px-5 pb-5">
            <EmptyState message="No follow-ups found." />
          </div>
        ) : (
          <div className="overflow-x-auto pb-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-xs text-gray-500 border-y border-gray-100">
                  <th className="px-5 py-3 font-semibold">Title</th>
                  <th className="px-4 py-3 font-semibold">Lead</th>
                  <th className="px-4 py-3 font-semibold">Due Date</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredFollowUps.map((followUp) => (
                  <tr
                    key={followUp.id}
                    data-testid={`follow-up-row-${followUp.id}`}
                    onClick={() => handleSelect(followUp)}
                    className={`border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                      selectedFollowUp?.id === followUp.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">{followUp.title}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700">
                      {leadName(followUp.lead)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700">
                      {formatShortDate(followUp.due_date)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700">
                      {followUp.completed ? 'Done' : 'Pending'}
                    </td>
                    <td className="px-4 py-4">
                      <RowMenu
                        followUp={followUp}
                        onToggle={handleToggle}
                        onEdit={openEditModal}
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

      {/* In-app confirm for kebab Delete (outside the modal) */}
      {confirmAction && selectedFollowUp && !isModalOpen && (
        <div className="mt-4">
          <ConfirmDialog
            message={`Permanently delete the follow-up "${selectedFollowUp.title}"? This cannot be undone.`}
            confirmLabel="Yes, delete"
            variant="danger"
            onConfirm={handleDelete}
            onCancel={() => setConfirmAction(null)}
          />
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editMode ? 'Edit Follow-up' : 'New Follow-up'}
      >
        <FollowUpForm
          initialData={editMode ? selectedFollowUp ?? undefined : undefined}
          lead={
            selectedFollowUp?.lead != null
              ? (leads.find((l) => l.id === selectedFollowUp.lead) ?? null)
              : undefined
          }
          leadName={
            editMode && selectedFollowUp?.lead != null
              ? leadName(selectedFollowUp.lead)
              : undefined
          }
          mode={editMode ? 'edit' : 'create'}
          onCancel={closeModal}
          onSuccess={() => {
            setModalOpen(false);
            setEditMode(false);
            setConfirmAction(null);
            refetchFollowUps();
          }}
        />
      </Modal>
    </div>
  );
}
