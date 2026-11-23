// src/components/forms/LeadForm.tsx
import { useState, useEffect } from 'react';
import { createLead, updateLead } from '../../api/leads';
import { fetchCustomFields } from '../../api/customFields';
import { getLeadFormSettings } from '../../api/leadFormSettings';
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
}

const LEAD_SOURCE_OPTIONS = [
  'Referral',
  'Website',
  'Walk-in',
  'Social Media',
  'Advertising',
  'Other',
];

const PREFERRED_CONTACT_OPTIONS = ['Email', 'Phone', 'Either'];

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'converted', label: 'Converted' },
  { value: 'lost', label: 'Lost' },
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Digits, spaces, parentheses, dashes, optional leading +, at least
// 7 characters in total.
const PHONE_PATTERN = /^\+?[0-9\s()\-]{7,}$/;

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
  agent: number;
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
  agent: 1,
};

type Errors = Record<string, string>;

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
    case 'phone':
      if (!values.phone.trim()) {
        return fieldConfig.phone.required ? 'Phone is required' : null;
      }
      return PHONE_PATTERN.test(values.phone.trim())
        ? null
        : 'Enter a valid phone number';
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
        : 'Property address is required';
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

export default function LeadForm({ initialData, mode, onSuccess }: LeadFormProps) {
  const [formData, setFormData] = useState<FormValues>(EMPTY_VALUES);
  const [customData, setCustomData] = useState<Record<string, any>>({});
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [fieldConfig, setFieldConfig] =
    useState<FieldConfigMap>(DEFAULT_FIELD_CONFIG);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  // Prefill from initialData in edit mode, including custom_data.
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
        agent: initialData.agent ?? 1,
      });
      setCustomData(initialData.custom_data ?? {});
    }
  }, [initialData]);

  // Fetch the agent's custom field definitions and the admin's field
  // preferences. Each fetch fails independently: a settings failure falls
  // back to the defaults (all visible, property_address required) and the
  // form still renders.
  useEffect(() => {
    fetchCustomFields()
      .then((fields) => setCustomFields(fields.filter((f) => f.is_active)))
      .catch(() => setCustomFields([]));
    getLeadFormSettings()
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
    const next = { ...customData, [field.name]: value };
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
      // Surface the backend's plain message (e.g. a trial quota error)
      // instead of the generic fallback.
      toast.error(extractErrorMessage(err, 'Error submitting lead'));
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (hasError: boolean) =>
    `w-full p-2 border rounded ${hasError ? 'border-red-500' : ''}`;

  const renderError = (key: string) =>
    errors[key] ? (
      <p data-testid={`lead-${key.replace('custom:', 'custom-')}-error`} className="text-sm text-red-600">
        {errors[key]}
      </p>
    ) : null;

  const renderCustomField = (field: CustomField) => {
    const testId = `lead-custom-${field.name}`;
    const errorKey = `custom:${field.name}`;
    const hasError = Boolean(errors[errorKey]);
    const value = customData[field.name] ?? '';
    const label = (
      <label htmlFor={testId} className="block text-sm font-medium">
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

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6 p-4">
      {/* Contact */}
      <fieldset className="space-y-4">
        <legend className="text-base font-semibold">Contact</legend>
        <div>
          <label htmlFor="lead-full_name" className="block text-sm font-medium">
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
          <label htmlFor="lead-email" className="block text-sm font-medium">
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
            <label htmlFor="lead-phone" className="block text-sm font-medium">
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
            <label htmlFor="lead-company" className="block text-sm font-medium">
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
      <fieldset className="space-y-4">
        <legend className="text-base font-semibold">Details</legend>
        {fieldConfig.property_address.visible && (
          <div>
            <label
              htmlFor="lead-property_address"
              className="block text-sm font-medium"
            >
              Property Address{fieldConfig.property_address.required ? ' *' : ''}
            </label>
            <input
              type="text"
              id="lead-property_address"
              name="property_address"
              data-testid="lead-property_address"
              placeholder="Property Address"
              value={formData.property_address}
              onChange={handleChange}
              className={inputClass(Boolean(errors.property_address))}
            />
            {renderError('property_address')}
          </div>
        )}
        {fieldConfig.lead_source.visible && (
          <div>
            <label htmlFor="lead-lead_source" className="block text-sm font-medium">
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
                <option key={option} value={option}>
                  {option}
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
              className="block text-sm font-medium"
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
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {renderError('preferred_contact')}
          </div>
        )}
      </fieldset>

      {/* Lead Info */}
      <fieldset className="space-y-4">
        <legend className="text-base font-semibold">Lead Info</legend>
        <div>
          <label htmlFor="lead-status" className="block text-sm font-medium">
            Status
          </label>
          <select
            id="lead-status"
            name="status"
            data-testid="lead-status"
            value={formData.status}
            onChange={handleChange}
            className="w-full p-2 border rounded"
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
            <label htmlFor="lead-notes" className="block text-sm font-medium">
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
        <fieldset className="space-y-4">
          <legend className="text-base font-semibold">Custom Fields</legend>
          {customFields.map(renderCustomField)}
        </fieldset>
      )}

      <button
        type="submit"
        data-testid="lead-submit"
        disabled={submitting}
        className={`px-4 py-2 text-white rounded ${
          submitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600'
        }`}
      >
        {submitting ? 'Submitting...' : mode === 'create' ? 'Create Lead' : 'Update Lead'}
      </button>
    </form>
  );
}
