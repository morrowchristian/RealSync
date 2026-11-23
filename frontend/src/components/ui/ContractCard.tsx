// src/components/ui/ContractCard.tsx
// Dedicated contract card view, modeled on ContactCard: a header row of
// blue pill buttons and a bordered label/value table of every field on
// the contract. Shown inside a Modal when a spreadsheet row is
// double-clicked. Archive/Delete confirm inline in the card body;
// signed contracts cannot be deleted (same guard as ArchivedContractsPage).
import { useState, type ReactNode } from 'react';
import { archiveContract, deleteContract } from '../../api/contracts';
import { toast } from 'react-toastify';
import ConfirmDialog from './ConfirmDialog';
import type { Contract } from '../../types/contract';

interface ContractCardProps {
  contract: Contract;
  /** Full name of the lead this contract belongs to. */
  leadName: string;
  /** Open the edit form (modal) for this contract. */
  onEdit: () => void;
  /** Called after a successful archive so the parent can close the card modal and refresh. */
  onArchived: () => void;
  /** Called after a successful delete so the parent can close the card modal and refresh. */
  onDeleted: () => void;
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

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-4 border-b border-gray-200 py-3 last:border-b-0">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900 break-words">{children}</dd>
    </div>
  );
}

export default function ContractCard({
  contract,
  leadName,
  onEdit,
  onArchived,
  onDeleted,
}: ContractCardProps) {
  // Which destructive action is awaiting in-app confirmation, if any.
  const [confirmAction, setConfirmAction] = useState<'archive' | 'delete' | null>(null);

  const requestDelete = () => {
    if (contract.status === 'signed') {
      toast.warn('Signed contracts cannot be deleted.');
      return;
    }
    setConfirmAction('delete');
  };

  const handleArchive = async () => {
    try {
      await archiveContract(contract.id);
      toast.success('Contract archived');
      setConfirmAction(null);
      onArchived();
    } catch (error) {
      toast.error('Failed to archive contract');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteContract(contract.id);
      toast.success('Contract permanently deleted');
      setConfirmAction(null);
      onDeleted();
    } catch (error) {
      toast.error('Failed to delete contract');
    }
  };

  return (
    <section
      data-testid="contract-card"
      aria-label={`Contract card for Contract #${contract.id}`}
      className="bg-white rounded-2xl border border-gray-200 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-end gap-2 px-5 pt-5 pb-4">
        <button
          type="button"
          onClick={onEdit}
          data-testid="contract-card-edit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => setConfirmAction('archive')}
          data-testid="contract-card-archive"
          className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-full hover:bg-orange-600"
        >
          Archive
        </button>
        <button
          type="button"
          onClick={requestDelete}
          data-testid="contract-card-delete"
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-full hover:bg-red-700"
        >
          Delete
        </button>
      </div>

      <dl className="px-5 pb-5">
        <Row label="Contract #">{contract.id}</Row>
        <Row label="Lead">{leadName}</Row>
        <Row label="Status">{contract.status}</Row>
        <Row label="Document">
          <span className="flex gap-3">
            <a
              href={contract.document}
              className="text-blue-600 hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              View PDF
            </a>
            <a href={contract.document} download className="text-blue-600 hover:underline">
              Download
            </a>
          </span>
        </Row>
        <Row label="Date Created">{formatDate(contract.created_at)}</Row>
      </dl>

      {confirmAction === 'archive' && (
        <div className="px-5 pb-5">
          <ConfirmDialog
            message={`Archive Contract #${contract.id}? The contract will move to Archived Contracts and can be restored later.`}
            confirmLabel="Yes, archive"
            variant="warn"
            onConfirm={handleArchive}
            onCancel={() => setConfirmAction(null)}
          />
        </div>
      )}
      {confirmAction === 'delete' && (
        <div className="px-5 pb-5">
          <ConfirmDialog
            message={`Permanently delete Contract #${contract.id}? This cannot be undone.`}
            confirmLabel="Yes, delete"
            variant="danger"
            onConfirm={handleDelete}
            onCancel={() => setConfirmAction(null)}
          />
        </div>
      )}
    </section>
  );
}
