// src/components/ui/EstimateCard.tsx
// Dedicated estimate card view, modeled on ContractCard: a header row of
// blue pill buttons and a bordered label/value table of every field on
// the estimate. Shown inside a Modal when a spreadsheet row is
// double-clicked. Delete confirms inline in the card body.
import { useState, type ReactNode } from 'react';
import { deleteEstimate } from '../../api/estimates';
import { toast } from 'react-toastify';
import ConfirmDialog from './ConfirmDialog';
import type { Estimate } from '../../types/estimate';
import { estimateStatusLabel } from '../../types/estimate';

interface EstimateCardProps {
  estimate: Estimate;
  /** Full name of the lead this estimate belongs to. */
  leadName: string;
  /** Open the edit form (modal) for this estimate. */
  onEdit: () => void;
  /** Called after a successful delete so the parent can close the card modal and refresh. */
  onDeleted: () => void;
  /** Open the add-follow-up form for this estimate, when provided. */
  onAddFollowUp?: () => void;
}

function formatDate(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', {
    month: 'long',
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

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-4 border-b border-gray-200 py-3 last:border-b-0">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900 break-words">{children}</dd>
    </div>
  );
}

export default function EstimateCard({
  estimate,
  leadName,
  onEdit,
  onDeleted,
  onAddFollowUp,
}: EstimateCardProps) {
  // Whether the destructive action is awaiting in-app confirmation.
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteEstimate(estimate.id);
      toast.success('Estimate deleted');
      setConfirmDelete(false);
      onDeleted();
    } catch (error) {
      toast.error('Failed to delete estimate');
    }
  };

  return (
    <section
      data-testid="estimate-card"
      aria-label={`Estimate card for Estimate #${estimate.id}`}
      className="bg-white rounded-2xl border border-gray-200 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-end gap-2 px-5 pt-5 pb-4">
        {onAddFollowUp && (
          <button
            type="button"
            onClick={onAddFollowUp}
            data-testid="estimate-card-add-follow-up"
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-full hover:bg-green-700"
          >
            Add follow-up
          </button>
        )}
        <button
          type="button"
          onClick={onEdit}
          data-testid="estimate-card-edit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          data-testid="estimate-card-delete"
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-full hover:bg-red-700"
        >
          Delete
        </button>
      </div>

      <dl className="px-5 pb-5">
        <Row label="Estimate #">{estimate.id}</Row>
        <Row label="Lead">{leadName}</Row>
        <Row label="Title">{estimate.title || '—'}</Row>
        <Row label="Description">{estimate.description || '—'}</Row>
        <Row label="Amount">{formatAmount(estimate.amount)}</Row>
        <Row label="Status">{estimateStatusLabel(estimate.status)}</Row>
        <Row label="Date Sent">{formatDate(estimate.date_sent)}</Row>
        <Row label="Notes">{estimate.notes || '—'}</Row>
        <Row label="Date Created">{formatDate(estimate.created_at)}</Row>
      </dl>

      {confirmDelete && (
        <div className="px-5 pb-5">
          <ConfirmDialog
            message={`Permanently delete Estimate #${estimate.id}? This cannot be undone.`}
            confirmLabel="Yes, delete"
            variant="danger"
            onConfirm={handleDelete}
            onCancel={() => setConfirmDelete(false)}
          />
        </div>
      )}
    </section>
  );
}
