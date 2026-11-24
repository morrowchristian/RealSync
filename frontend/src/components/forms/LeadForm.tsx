// src/components/forms/LeadForm.tsx
import { useState, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import { ModalFooterContext } from '../ui/Modal';
import { createLead, updateLead } from '../../api/leads';
import { fetchCustomFields } from '../../api/customFields';
import { getLeadFormSettings } from '../../api/leadFormSettings';
import { withRetry } from '../../utils/retry';
import {
  DEFAULT_FIELD_CONFIG,
  mergeFieldConfig,
  type CustomField,
  type FieldConfigMap,
} from '../../types/customField';
import { toast } from 'react-toastify';
import { extractErrorMessage } from '../../utils/trial';

interface LeadFormProps {
  initialData?: any;
  mode: 'create' | 'edit';
  onSuccess: () => void;
  /** Optional Cancel handler (e.g. close the enclosing modal). */
  onCancel?: () => void;
}

// Backend choice keys (see backend/leads/models.py) with their display
// labels. The <option> value MUST be the backend key — sending the display
// label used to fail with a 400 ("not a valid choice") and left the
// dropdown blank in edit mode because the saved key matched no option.
export const LEAD_SOURCE_OPTIONS = [
  { value: 'referral', label: 'Referral' },
  { value: 'website', label: 'Website' },
  { value: 'walk_in', label: 'Walk-in' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'advertising', label: 'Advertising' },
  { value: 'other', label: 'Other' },
];

export const PREFERRED_CONTACT_OPTIONS = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'either', label: 'Either' },
];

export function leadSourceLabel(value?: string | null): string {
  if (!value) return '—';
  return (
    LEAD_SOURCE_OPTIONS.find((o) => o.value === value)?.label ?? value
  );
}

export function preferredContactLabel(value?: string | null): string {
  if (!value) return '—';
  return (
    PREFERRED_CONTACT_OPTIONS.find((o) => o.value === value)?.label ?? value
  );
}

export const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'converted', label: 'Converted' },
  { value: 'lost', label: 'Lost' },
];

export function statusLabel(value?: string | null): string {
  if (!value) return '—';
  return STATUS_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Digits, spaces, parentheses, dashes, optional leading +, 7–20 chars.
// The 20-char cap matches the backend (Lead.phone max_length=20).
export const PHONE_PATTERN = /^\+?[0-9\s()\-]{7,20}$/;
export const PHONE_MAX_LENGTH = 20;

interface FormValues {
  full_name: string;
  email: string;
  phone: string;
  company: string;
  property_address: string;
  lead_source: string;
  preferred_contact: string;
  status: string;
  notes: string;
}

const EMPTY_VALUES: FormValues = {
  full_name: '',
  email: '',
  phone: '',
  company: '',
  property_address: '',
  lead_source: '',
  preferred_contact: '',
  status: 'new',
  notes: '',
};

type Errors = Record<string, string>;

/** Pull per-field errors out of a DRF 400 body, e.g. { lead_source: ["..."] }. */
export function extractFieldErrors(err: unknown): Errors {
  const data = (err as { response?: { data?: unknown } } | null)?.response
    ?.data;
  if (!data || typeof data !== 'object') return {};
  const out: Errors = {};
  const toMessage = (value: unknown): string => {
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) {
      return value
        .filter((v): v is string => typeof v === 'string' && v.trim() !== '')
        .join(' ');
    }
    return '';
  };
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    // Top-level detail/message/non_field_errors are shown in the toast,
    // not next to a field.
    if (['detail', 'message', 'error', 'non_field_errors'].includes(key)) {
      continue;
    }
    if (key === 'custom_data' && value && typeof value === 'object') {
      for (const [name, nested] of Object.entries(
        value as Record<string, unknown>
      )) {
        const msg = toMessage(nested);
        if (msg) out[`custom:${name}`] = msg;
      }
      continue;
    }
    const msg = toMessage(value);
    if (msg) out[key] = msg;
  }
  return out;
}

function validateField(
  name: string,
  value: string | boolean | undefined,
  values: FormValues,
  customData: Record<string, any>,
  fieldConfig: FieldConfigMap,
  customFields: CustomField[]
): string | null {
  switch (name) {
    case 'full_name':
      return values.full_name.trim() ? null : 'Full name is required';
    case 'email':
      if (!values.email.trim()) return 'Email is required';
      return EMAIL_PATTERN.test(values.email.trim())
        ? null
        : 'Enter a valid email address';
    case 'phone': {
      if (!values.phone.trim()) {
        return fieldConfig.phone.required ? 'Phone is required' : null;
      }
      const phone = values.phone.trim();
      if (phone.length > PHONE_MAX_LENGTH) {
        return `Phone number must be ${PHONE_MAX_LENGTH} characters or fewer`;
      }
      return PHONE_PATTERN.test(phone)
        ? null
        : 'Enter a valid phone number';
    }
    case 'company':
      return fieldConfig.company.required && !values.company.trim()
        ? 'Company is required'
        : null;
    case 'lead_source':
      return fieldConfig.lead_source.required && !values.lead_source.trim()
        ? 'Lead source is required'
        : null;
    case 'preferred_contact':
      return fieldConfig.preferred_contact.required &&
        !values.preferred_contact.trim()
        ? 'Preferred contact is required'
        : null;
    case 'notes':
      return fieldConfig.notes.required && !values.notes.trim()
        ? 'Notes are required'
        : null;
    case 'property_address':
      if (!fieldConfig.property_address.required) return null;
      return values.property_address.trim()
        ? null
        : 'Job site address is required';
    default: {
      if (name.startsWith('custom:')) {
        const fieldName = name.slice('custom:'.length);
        const field = customFields.find((f) => f.name === fieldName);
        if (!field || !field.required) return null;
        const v = customData[fieldName];
        if (field.field_type === 'checkbox') {
          return v === true ? null : `${field.label} is required`;
        }
        return v !== undefined && v !== null && String(v).trim() !== ''
          ? null
          : `${field.label} is required`;
      }
      return null;
    }
  }
}

function validateAll(
  values: FormValues,
  customData: Record<string, any>,
  fieldConfig: FieldConfigMap,
  customFields: CustomField[]
): Errors {
  const errors: Errors = {};
  const names = [
    'full_name',
    'email',
    'phone',
    'company',
    'property_address',
    'lead_source',
    'preferred_contact',
    'notes',
  ];
  names.forEach((name) => {
    const err = validateField(name, undefined, values, customData, fieldConfig, customFields);
    if (err) errors[name] = err;
  });
  customFields
    .filter((f) => f.is_active)
    .forEach((field) => {
      const err = validateField(
        `custom:${field.name}`,
        undefined,
        values,
        customData,
        fieldConfig,
        customFields
      );
      if (err) errors[`custom:${field.name}`] = err;
    });
  return errors;
}

export default function LeadForm({ initialData, mode, onSuccess, onCancel }: LeadFormProps) {
  const [formData, setFormData] = useState<FormValues>(EMPTY_VALUES);
  const [customData, setCustomData] = useState<Record<string, any>>({});
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [fieldConfig, setFieldConfig] =
    useState<FieldConfigMap>(DEFAULT_FIELD_CONFIG);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  // The enclosing Modal's fixed footer, when this form is rendered inside
  // one — the submit/cancel actions portal into it so they stay visible
  // without scrolling. Null when rendered outside a Modal.
  const modalFooterEl = useContext(ModalFooterContext);

  // Prefill from initialData in edit mode, including custom_data.
  // `agent` is intentionally NOT kept: the backend forces the lead to the
  // logged-in user on create/update, so the form must not assume an id.
  useEffect(() => {
    if (initialData) {
      setFormData({
        full_name: initialData.full_name ?? '',
        email: initialData.email ?? '',
        phone: initialData.phone ?? '',
        company: initialData.company ?? '',
        property_address: initialData.property_address ?? '',
        lead_source: initialData.lead_source ?? '',
        preferred_contact: initialData.preferred_contact ?? '',
        status: initialData.status ?? 'new',
        notes: initialData.notes ?? '',
      });
      setCustomData(initialData.custom_data ?? {});
    }
  }, [initialData]);

  // Fetch the agent's custom field definitions and the admin's field
  // preferences. Each fetch fails independently: a settings failure falls
  // back to the defaults (all visible, property_address required) and the
  // form still renders.
  // The settings fetch is retried (silent) because a single transient
  // failure — e.g. the free backend waking from sleep — used to leave the
  // form showing the default `*` markers instead of the saved settings.
  // Once the fetch resolves the form re-renders with the saved config,
  // so the `*` and the required validation follow the per-account
  // settings.
  useEffect(() => {
    fetchCustomFields()
      .then((fields) => setCustomFields(fields.filter((f) => f.is_active)))
      .catch(() => setCustomFields([]));
    withRetry(() => getLeadFormSettings({ silent: true }), 3, 1000)
      .then((settings) =>
        setFieldConfig(mergeFieldConfig(settings?.field_config))
      )
      .catch(() => setFieldConfig(DEFAULT_FIELD_CONFIG));
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    const next = { ...formData, [name]: value };
    setFormData(next);
    // Live-clear: re-validate this field as soon as the user fixes it.
    if (errors[name]) {
      const err = validateField(name, value, next, customData, fieldConfig, customFields);
      if (!err) {
        setErrors((prev) => {
          const copy = { ...prev };
          delete copy[name];
          return copy;
        });
      }
    }
  };

  const handleCustomChange = (field: CustomField, value: string | boolean) => {
    // Number custom fields store a real number in custom_data, not a string.
    const stored =
      field.field_type === 'number' && typeof value === 'string'
        ? value === ''
          ? ''
          : Number(value)
        : value;
    const next = { ...customData, [field.name]: stored };
    setCustomData(next);
    const key = `custom:${field.name}`;
    if (errors[key]) {
      const err = validateField(key, value, formData, next, fieldConfig, customFields);
      if (!err) {
        setErrors((prev) => {
          const copy = { ...prev };
          delete copy[key];
          return copy;
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateAll(formData, customData, fieldConfig, customFields);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setSubmitting(true);
    try {
      // No `agent` in the payload: the backend forces it to the logged-in
      // user, so sending a hardcoded id (previously 1) was wrong.
      const payload = { ...formData, custom_data: customData };
      if (mode === 'create') {
        await createLead(payload);
        toast.success('Lead created successfully');
      } else {
        await updateLead(initialData.id, payload);
        toast.success('Lead updated successfully');
      }
      onSuccess();
    } catch (err) {
      console.error('Error submitting lead:', err);
      // Surface the backend's errors: field errors go next to the matching
      // field; the message (detail / field errors joined) goes in the toast
      // so a 400 is never just a bare generic error.
      const fieldErrors = extractFieldErrors(err);
      if (Object.keys(fieldErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...fieldErrors }));
      }
      toast.error(extractErrorMessage(err, 'Error submitting lead'));
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (hasError: boolean) =>
    `w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 ${
      hasError ? 'border-red-500' : 'border-gray-300'
    }`;

  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

  const renderError = (key: string) =>
    errors[key] ? (
      <p data-testid={`lead-${key.replace('custom:', 'custom-')}-error`} className="mt-1 text-sm text-red-600">
        {errors[key]}
      </p>
    ) : null;

  const renderCustomField = (field: CustomField) => {
    const testId = `lead-custom-${field.name}`;
    const errorKey = `custom:${field.name}`;
    const hasError = Boolean(errors[errorKey]);
    const value = customData[field.name] ?? '';
    const label = (
      <label htmlFor={testId} className={labelClass}>
        {field.label}
        {field.required ? ' *' : ''}
      </label>
    );

    switch (field.field_type) {
      case 'textarea':
        return (
          <div key={field.id}>
            {label}
            <textarea
              id={testId}
              name={field.name}
              data-testid={testId}
              placeholder={field.label}
              value={typeof value === 'string' ? value : ''}
              onChange={(e) => handleCustomChange(field, e.target.value)}
              className={inputClass(hasError)}
            />
            {renderError(errorKey)}
          </div>
        );
      case 'number':
        return (
          <div key={field.id}>
            {label}
            <input
              type="number"
              id={testId}
              name={field.name}
              data-testid={testId}
              placeholder={field.label}
              value={typeof value === 'string' || typeof value === 'number' ? value : ''}
              onChange={(e) => handleCustomChange(field, e.target.value)}
              className={inputClass(hasError)}
            />
            {renderError(errorKey)}
          </div>
        );
      case 'date':
        return (
          <div key={field.id}>
            {label}
            <input
              type="date"
              id={testId}
              name={field.name}
              data-testid={testId}
              value={typeof value === 'string' ? value : ''}
              onChange={(e) => handleCustomChange(field, e.target.value)}
              className={inputClass(hasError)}
            />
            {renderError(errorKey)}
          </div>
        );
      case 'email':
        return (
          <div key={field.id}>
            {label}
            <input
              type="email"
              id={testId}
              name={field.name}
              data-testid={testId}
              placeholder={field.label}
              value={typeof value === 'string' ? value : ''}
              onChange={(e) => handleCustomChange(field, e.target.value)}
              className={inputClass(hasError)}
            />
            {renderError(errorKey)}
          </div>
        );
      case 'phone':
        return (
          <div key={field.id}>
            {label}
            <input
              type="tel"
              id={testId}
              name={field.name}
              data-testid={testId}
              placeholder={field.label}
              value={typeof value === 'string' ? value : ''}
              onChange={(e) => handleCustomChange(field, e.target.value)}
              className={inputClass(hasError)}
            />
            {renderError(errorKey)}
          </div>
        );
      case 'dropdown':
        return (
          <div key={field.id}>
            {label}
            <select
              id={testId}
              name={field.name}
              data-testid={testId}
              value={typeof value === 'string' ? value : ''}
              onChange={(e) => handleCustomChange(field, e.target.value)}
              className={inputClass(hasError)}
            >
              <option value="">—</option>
              {(field.options ?? []).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {renderError(errorKey)}
          </div>
        );
      case 'checkbox':
        return (
          <div key={field.id} className="flex items-start gap-2">
            <input
              type="checkbox"
              id={testId}
              name={field.name}
              data-testid={testId}
              checked={value === true}
              onChange={(e) => handleCustomChange(field, e.target.checked)}
              className="mt-1"
            />
            <div>
              {label}
              {renderError(errorKey)}
            </div>
          </div>
        );
      case 'text':
      default:
        return (
          <div key={field.id}>
            {label}
            <input
              type="text"
              id={testId}
              name={field.name}
              data-testid={testId}
              placeholder={field.label}
              value={typeof value === 'string' ? value : ''}
              onChange={(e) => handleCustomChange(field, e.target.value)}
              className={inputClass(hasError)}
            />
            {renderError(errorKey)}
          </div>
        );
    }
  };

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
        form="lead-form"
        data-testid="lead-submit"
        disabled={submitting}
        className={`px-6 py-2.5 text-white font-medium rounded-full ${
          submitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {submitting ? 'Submitting...' : mode === 'create' ? 'Create Lead' : 'Update Lead'}
      </button>
      {onCancel && (
        <button
          type="button"
          data-testid="lead-cancel"
          onClick={onCancel}
          className="px-4 py-2.5 text-gray-700 font-medium rounded-full border border-gray-300 hover:bg-gray-100"
        >
          Cancel
        </button>
      )}
    </div>
  );

  return (
    <form id="lead-form" onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* Contact */}
      <fieldset className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
        <legend className="px-1 text-base font-semibold text-gray-900">Contact</legend>
        <div>
          <label htmlFor="lead-full_name" className={labelClass}>
            Full Name *
          </label>
          <input
            type="text"
            id="lead-full_name"
            name="full_name"
            data-testid="lead-full_name"
            placeholder="Full Name"
            value={formData.full_name}
            onChange={handleChange}
            className={inputClass(Boolean(errors.full_name))}
          />
          {renderError('full_name')}
        </div>
        <div>
          <label htmlFor="lead-email" className={labelClass}>
            Email *
          </label>
          <input
            type="email"
            id="lead-email"
            name="email"
            data-testid="lead-email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className={inputClass(Boolean(errors.email))}
          />
          {renderError('email')}
        </div>
        {fieldConfig.phone.visible && (
          <div>
            <label htmlFor="lead-phone" className={labelClass}>
              Phone{fieldConfig.phone.required ? ' *' : ''}
            </label>
            <input
              type="tel"
              id="lead-phone"
              name="phone"
              data-testid="lead-phone"
              placeholder="Phone"
              value={formData.phone}
              onChange={handleChange}
              className={inputClass(Boolean(errors.phone))}
            />
            {renderError('phone')}
          </div>
        )}
        {fieldConfig.company.visible && (
          <div>
            <label htmlFor="lead-company" className={labelClass}>
              Company{fieldConfig.company.required ? ' *' : ''}
            </label>
            <input
              type="text"
              id="lead-company"
              name="company"
              data-testid="lead-company"
              placeholder="Company"
              value={formData.company}
              onChange={handleChange}
              className={inputClass(Boolean(errors.company))}
            />
            {renderError('company')}
          </div>
        )}
      </fieldset>

      {/* Details */}
      <fieldset className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
        <legend className="px-1 text-base font-semibold text-gray-900">Details</legend>
        {fieldConfig.property_address.visible && (
          <div>
            <label
              htmlFor="lead-property_address"
              className={labelClass}
            >
              Job Site Address{fieldConfig.property_address.required ? ' *' : ''}
            </label>
            <input
              type="text"
              id="lead-property_address"
              name="property_address"
              data-testid="lead-property_address"
              placeholder="Job Site Address"
              value={formData.property_address}
              onChange={handleChange}
              className={inputClass(Boolean(errors.property_address))}
            />
            {renderError('property_address')}
          </div>
        )}
        {fieldConfig.lead_source.visible && (
          <div>
            <label htmlFor="lead-lead_source" className={labelClass}>
              Lead Source{fieldConfig.lead_source.required ? ' *' : ''}
            </label>
            <select
              id="lead-lead_source"
              name="lead_source"
              data-testid="lead-lead_source"
              value={formData.lead_source}
              onChange={handleChange}
              className={inputClass(Boolean(errors.lead_source))}
            >
              <option value="">—</option>
              {LEAD_SOURCE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {renderError('lead_source')}
          </div>
        )}
        {fieldConfig.preferred_contact.visible && (
          <div>
            <label
              htmlFor="lead-preferred_contact"
              className={labelClass}
            >
              Preferred Contact{fieldConfig.preferred_contact.required ? ' *' : ''}
            </label>
            <select
              id="lead-preferred_contact"
              name="preferred_contact"
              data-testid="lead-preferred_contact"
              value={formData.preferred_contact}
              onChange={handleChange}
              className={inputClass(Boolean(errors.preferred_contact))}
            >
              <option value="">—</option>
              {PREFERRED_CONTACT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {renderError('preferred_contact')}
          </div>
        )}
      </fieldset>

      {/* Lead Info */}
      <fieldset className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
        <legend className="px-1 text-base font-semibold text-gray-900">Lead Info</legend>
        <div>
          <label htmlFor="lead-status" className={labelClass}>
            Status
          </label>
          <select
            id="lead-status"
            name="status"
            data-testid="lead-status"
            value={formData.status}
            onChange={handleChange}
            className={inputClass(false)}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        {fieldConfig.notes.visible && (
          <div>
            <label htmlFor="lead-notes" className={labelClass}>
              Notes{fieldConfig.notes.required ? ' *' : ''}
            </label>
            <textarea
              id="lead-notes"
              name="notes"
              data-testid="lead-notes"
              placeholder="Notes"
              value={formData.notes}
              onChange={handleChange}
              className={inputClass(Boolean(errors.notes))}
            />
            {renderError('notes')}
          </div>
        )}
      </fieldset>

      {/* Custom Fields */}
      {customFields.length > 0 && (
        <fieldset className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
          <legend className="px-1 text-base font-semibold text-gray-900">Custom Fields</legend>
          {customFields.map(renderCustomField)}
        </fieldset>
      )}

      {modalFooterEl ? (
        createPortal(actions, modalFooterEl)
      ) : (
        <div className="pt-1">{actions}</div>
      )}
    </form>
  );
}
