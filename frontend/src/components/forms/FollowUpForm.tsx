// src/components/forms/FollowUpForm.tsx
import { useState, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import { ModalFooterContext } from '../ui/Modal';
import { createFollowUp, updateFollowUp } from '../../api/followUps';
import { toast } from 'react-toastify';
import { extractErrorMessage } from '../../utils/trial';
import type { FollowUp } from '../../types/followUp';
import type { Lead } from '../../types/lead';
import type { Estimate } from '../../types/estimate';

interface FollowUpFormProps {
  initialData?: FollowUp;
  /** Prefilled lead when creating from a lead's card. Shown, not editable. */
  lead?: Lead | null;
  /** Prefilled estimate when creating from an estimate's card. Shown, not editable. */
  estimate?: Estimate | null;
  /** Lead name for the read-only row when only an id is known (edit mode). */
  leadName?: string;
  mode: 'create' | 'edit';
  onSuccess: () => void;
  /** Optional Cancel handler (e.g. close the enclosing modal). */
  onCancel?: () => void;
}

export default function FollowUpForm({
  initialData,
  lead,
  estimate,
  leadName,
  mode,
  onSuccess,
  onCancel,
}: FollowUpFormProps) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // The enclosing Modal's fixed footer, when this form is rendered inside
  // one — the submit/cancel actions portal into it so they stay visible
  // without scrolling. Null when rendered outside a Modal.
  const modalFooterEl = useContext(ModalFooterContext);

  // Prefill from initialData in edit mode.
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title ?? '');
      setDueDate(initialData.due_date ?? '');
      setNotes(initialData.notes ?? '');
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Title is required.');
      return;
    }
    if (!dueDate) {
      toast.error('Due date is required.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'create') {
        const payload: Partial<FollowUp> = {
          lead: lead?.id ?? initialData?.lead ?? null,
          estimate: estimate?.id ?? initialData?.estimate ?? null,
          title: title.trim(),
          due_date: dueDate,
          completed: false,
          notes: notes.trim(),
        };
        await createFollowUp(payload);
        toast.success('Follow-up created successfully');
      } else if (initialData) {
        await updateFollowUp(initialData.id, {
          title: title.trim(),
          due_date: dueDate,
          notes: notes.trim(),
        });
        toast.success('Follow-up updated successfully');
      }

      onSuccess();
    } catch (err) {
      console.error('Error submitting follow-up:', err);
      toast.error(extractErrorMessage(err, 'Error submitting follow-up'));
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

  // Submit/Cancel actions. When the form is inside a Modal they are
  // portaled into the modal's fixed footer (always visible on open);
  // the submit button names the form via the `form` attribute because
  // the portal places it outside the <form> element in the DOM, so it
  // still triggers this form's submit. Rendered standalone (no Modal)
  // the same buttons render inline at the end of the form as before.
  const actions = (
    <div className="flex items-center gap-3">
      <button
        type="submit"
        form="follow-up-form"
        data-testid="follow-up-submit"
        disabled={submitting}
        className={`px-6 py-2.5 text-white font-medium rounded-full ${
          submitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {submitting
          ? 'Submitting...'
          : mode === 'create'
            ? 'Create Follow-up'
            : 'Update Follow-up'}
      </button>
      {onCancel && (
        <button
          type="button"
          data-testid="follow-up-cancel"
          onClick={onCancel}
          className="px-4 py-2.5 text-gray-700 font-medium rounded-full border border-gray-300 hover:bg-gray-100"
        >
          Cancel
        </button>
      )}
    </div>
  );

  // The linked lead / estimate is prefilled by the caller and shown
  // read-only — it is not editable from this form.
  const linkedLeadName =
    lead?.full_name ?? leadName ?? (initialData?.lead != null ? `Lead #${initialData.lead}` : null);
  const linkedEstimateTitle =
    estimate?.title ?? (initialData?.estimate != null ? `Estimate #${initialData.estimate}` : null);

  return (
    <form id="follow-up-form" onSubmit={handleSubmit} noValidate className="space-y-6">
      <fieldset className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
        <legend className="px-1 text-base font-semibold text-gray-900">Follow-up</legend>
        {linkedLeadName && (
          <p data-testid="follow-up-lead" className="text-sm text-gray-700">
            <span className="font-medium">Lead: </span>
            {linkedLeadName}
          </p>
        )}
        {linkedEstimateTitle && (
          <p data-testid="follow-up-estimate" className="text-sm text-gray-700">
            <span className="font-medium">Estimate: </span>
            {linkedEstimateTitle}
          </p>
        )}
        <div>
          <label htmlFor="follow-up-title" className={labelClass}>
            Title *
          </label>
          <input
            type="text"
            id="follow-up-title"
            name="title"
            data-testid="follow-up-title"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="follow-up-due_date" className={labelClass}>
            Due Date *
          </label>
          <input
            type="date"
            id="follow-up-due_date"
            name="due_date"
            data-testid="follow-up-due_date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="follow-up-notes" className={labelClass}>
            Notes
          </label>
          <textarea
            id="follow-up-notes"
            name="notes"
            data-testid="follow-up-notes"
            placeholder="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={inputClass}
          />
        </div>
      </fieldset>

      {modalFooterEl ? (
        createPortal(actions, modalFooterEl)
      ) : (
        <div className="pt-1">{actions}</div>
      )}
    </form>
  );
}
