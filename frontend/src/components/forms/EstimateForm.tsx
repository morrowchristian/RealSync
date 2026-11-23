// src/components/forms/EstimateForm.tsx
import { useState, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import { ModalFooterContext } from '../ui/Modal';
import { createEstimate, updateEstimate } from '../../api/estimates';
import { toast } from 'react-toastify';
import { extractErrorMessage } from '../../utils/trial';
import { ESTIMATE_STATUS_OPTIONS, type Estimate } from '../../types/estimate';
import type { Lead } from '../../types/lead';

interface EstimateFormProps {
  initialData?: Estimate;
  leads: Lead[];
  /** Prefilled lead when creating from a lead's card. */
  prefilledLeadId?: number;
  mode: 'create' | 'edit';
  onSuccess: () => void;
  /** Optional Cancel handler (e.g. close the enclosing modal). */
  onCancel?: () => void;
}

export default function EstimateForm({
  initialData,
  leads,
  prefilledLeadId,
  mode,
  onSuccess,
  onCancel,
}: EstimateFormProps) {
  const [leadId, setLeadId] = useState<number>(
    prefilledLeadId ?? leads[0]?.id ?? 0
  );
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<Estimate['status']>('sent');
  const [dateSent, setDateSent] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // The enclosing Modal's fixed footer, when this form is rendered inside
  // one — the submit/cancel actions portal into it so they stay visible
  // without scrolling. Null when rendered outside a Modal.
  const modalFooterEl = useContext(ModalFooterContext);

  // Prefill from initialData in edit mode.
  useEffect(() => {
    if (initialData) {
      setLeadId(initialData.lead);
      setTitle(initialData.title ?? '');
      setDescription(initialData.description ?? '');
      setAmount(initialData.amount ?? '');
      setStatus(initialData.status ?? 'sent');
      setDateSent(initialData.date_sent ?? '');
      setNotes(initialData.notes ?? '');
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!leadId) {
      toast.error('Please select a lead.');
      return;
    }
    if (!title.trim()) {
      toast.error('Title is required.');
      return;
    }

    setSubmitting(true);
    try {
      // Amount is a decimal the backend serializes as a string; send it
      // as a string (or null when blank).
      const payload: Partial<Estimate> = {
        lead: leadId,
        title: title.trim(),
        description: description.trim(),
        amount: amount.trim() === '' ? null : amount.trim(),
        status,
        date_sent: dateSent === '' ? null : dateSent,
        notes: notes.trim(),
      };

      if (mode === 'create') {
        await createEstimate(payload);
        toast.success('Estimate created successfully');
      } else if (initialData) {
        await updateEstimate(initialData.id, payload);
        toast.success('Estimate updated successfully');
      }

      onSuccess();
    } catch (err) {
      console.error('Error submitting estimate:', err);
      // Surface the backend's plain message (e.g. a trial quota error)
      // instead of the generic fallback.
      toast.error(extractErrorMessage(err, 'Error submitting estimate'));
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
        form="estimate-form"
        data-testid="estimate-submit"
        disabled={submitting}
        className={`px-6 py-2.5 text-white font-medium rounded-full ${
          submitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {submitting
          ? 'Submitting...'
          : mode === 'create'
            ? 'Create Estimate'
            : 'Update Estimate'}
      </button>
      {onCancel && (
        <button
          type="button"
          data-testid="estimate-cancel"
          onClick={onCancel}
          className="px-4 py-2.5 text-gray-700 font-medium rounded-full border border-gray-300 hover:bg-gray-100"
        >
          Cancel
        </button>
      )}
    </div>
  );

  return (
    <form id="estimate-form" onSubmit={handleSubmit} noValidate className="space-y-6">
      <fieldset className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
        <legend className="px-1 text-base font-semibold text-gray-900">Estimate</legend>
        <div>
          <label htmlFor="estimate-lead" className={labelClass}>
            Lead *
          </label>
          <select
            id="estimate-lead"
            name="lead"
            data-testid="estimate-lead"
            value={leadId}
            onChange={(e) => setLeadId(Number(e.target.value))}
            className={inputClass}
          >
            {leads.map((lead) => (
              <option key={lead.id} value={lead.id}>
                {lead.full_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="estimate-title" className={labelClass}>
            Title *
          </label>
          <input
            type="text"
            id="estimate-title"
            name="title"
            data-testid="estimate-title"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="estimate-description" className={labelClass}>
            Description
          </label>
          <textarea
            id="estimate-description"
            name="description"
            data-testid="estimate-description"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="estimate-amount" className={labelClass}>
            Amount
          </label>
          <input
            type="number"
            id="estimate-amount"
            name="amount"
            data-testid="estimate-amount"
            placeholder="0.00"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="estimate-status" className={labelClass}>
            Status
          </label>
          <select
            id="estimate-status"
            name="status"
            data-testid="estimate-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as Estimate['status'])}
            className={inputClass}
          >
            {ESTIMATE_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="estimate-date_sent" className={labelClass}>
            Date Sent
          </label>
          <input
            type="date"
            id="estimate-date_sent"
            name="date_sent"
            data-testid="estimate-date_sent"
            value={dateSent}
            onChange={(e) => setDateSent(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="estimate-notes" className={labelClass}>
            Notes
          </label>
          <textarea
            id="estimate-notes"
            name="notes"
            data-testid="estimate-notes"
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
