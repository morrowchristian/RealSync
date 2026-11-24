// src/components/ui/ContactCard.tsx
// Dedicated contact card view (Redesign Reference 1): a clean card with a
// "← Go back" link, a blue "Toggle Inline Edit" button, and a bordered
// label/value table of every field on the lead — email/phone as links,
// plus a "Link to Edit Entry" row. Toggling inline edit renders the
// LeadForm inside the card.
import { useState, type ReactNode } from 'react';
import type { Lead } from '../../types/lead';
import type { CustomField } from '../../types/customField';
import LeadForm, {
  leadSourceLabel,
  preferredContactLabel,
  statusLabel,
} from '../forms/LeadForm';

interface ContactCardProps {
  lead: Lead;
  /** Custom-field definitions, for labelling custom_data values. */
  customFields?: CustomField[];
  /** Display name of the owning agent, when known. */
  ownerName?: string;
  onBack: () => void;
  /** Open the edit form (modal) for this lead. */
  onEdit: () => void;
  /** Called after a successful inline edit so the parent can refresh. */
  onUpdated?: () => void;
  /** Open the new-estimate form for this lead, when provided. */
  onNewEstimate?: () => void;
  /** Open the add-follow-up form for this lead, when provided. */
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

function formatCustomValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

function prettifyName(name: string): string {
  return name
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-4 border-b border-gray-200 py-3 last:border-b-0">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900 break-words">{children}</dd>
    </div>
  );
}

export default function ContactCard({
  lead,
  customFields = [],
  ownerName,
  onBack,
  onEdit,
  onUpdated,
  onNewEstimate,
  onAddFollowUp,
}: ContactCardProps) {
  const [editing, setEditing] = useState(false);

  const customEntries = Object.entries(lead.custom_data ?? {}).filter(
    ([, value]) => value !== undefined && value !== null && value !== ''
  );

  return (
    <section
      data-testid="contact-card"
      aria-label={`Contact card for ${lead.full_name}`}
      className="bg-white rounded-2xl border border-gray-200 shadow-sm"
    >
      <div className="flex items-center justify-between gap-2 px-5 pt-5 pb-4">
        <button
          type="button"
          onClick={onBack}
          data-testid="contact-card-back"
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← Go back
        </button>
        <button
          type="button"
          onClick={() => setEditing((prev) => !prev)}
          data-testid="contact-card-toggle-edit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700"
        >
          Toggle Inline Edit
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 px-5 pb-4">
        {onNewEstimate && (
          <button
            type="button"
            onClick={onNewEstimate}
            data-testid="contact-card-new-estimate"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700"
          >
            + New Estimate
          </button>
        )}
        {onAddFollowUp && (
          <button
            type="button"
            onClick={onAddFollowUp}
            data-testid="contact-card-add-follow-up"
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-full hover:bg-green-700"
          >
            Add follow-up
          </button>
        )}
      </div>

      <h2 className="px-5 pb-2 text-xl font-bold text-gray-900">
        Contact card
      </h2>

      {editing ? (
        <div className="px-5 pb-5">
          <LeadForm
            initialData={lead}
            mode="edit"
            onSuccess={() => {
              setEditing(false);
              onUpdated?.();
            }}
            onCancel={() => setEditing(false)}
          />
        </div>
      ) : (
        <dl className="px-5 pb-5">
          <Row label="Name">{lead.full_name || '—'}</Row>
          <Row label="Company">{lead.company || '—'}</Row>
          <Row label="Email">
            {lead.email ? (
              <a
                href={`mailto:${lead.email}`}
                className="text-blue-600 hover:underline"
              >
                {lead.email}
              </a>
            ) : (
              '—'
            )}
          </Row>
          <Row label="Phone">
            {lead.phone ? (
              <a
                href={`tel:${lead.phone.replace(/[\s()\-]/g, '')}`}
                className="text-blue-600 hover:underline"
              >
                {lead.phone}
              </a>
            ) : (
              '—'
            )}
          </Row>
          <Row label="Status">{statusLabel(lead.status)}</Row>
          <Row label="Owner">
            {ownerName ?? `Agent #${lead.agent}`}
          </Row>
          <Row label="Source">{leadSourceLabel(lead.lead_source)}</Row>
          <Row label="Preferred Contact">
            {preferredContactLabel(lead.preferred_contact)}
          </Row>
          <Row label="Job Site Address">
            {lead.property_address || '—'}
          </Row>
          <Row label="Notes">{lead.notes || '—'}</Row>
          <Row label="Date Created">{formatDate(lead.created_at)}</Row>
          {customEntries.map(([name, value]) => {
            const field = customFields.find((f) => f.name === name);
            return (
              <Row key={name} label={field?.label ?? prettifyName(name)}>
                {formatCustomValue(value)}
              </Row>
            );
          })}
          <Row label="Link to Edit Entry">
            <button
              type="button"
              onClick={onEdit}
              data-testid="contact-card-edit-entry"
              className="text-blue-600 hover:underline"
            >
              Edit Entry
            </button>
          </Row>
        </dl>
      )}
    </section>
  );
}
