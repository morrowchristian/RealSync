// src/components/forms/CustomFieldForm.tsx
// Shared inline Add/Edit form for an agent-defined custom lead field.
// Used by SettingsPage for both flows so the two don't drift apart.
import { useState } from 'react';
import {
  CUSTOM_FIELD_TYPES,
  type CustomField,
  type CustomFieldType,
} from '../../types/customField';
import type { CustomFieldPayload } from '../../api/customFields';

interface CustomFieldFormProps {
  initial?: CustomField | null;
  saving: boolean;
  onSave: (data: CustomFieldPayload) => void;
  onCancel: () => void;
}

export default function CustomFieldForm({
  initial,
  saving,
  onSave,
  onCancel,
}: CustomFieldFormProps) {
  const [label, setLabel] = useState(initial?.label ?? '');
  const [fieldType, setFieldType] = useState<CustomFieldType>(
    initial?.field_type ?? 'text'
  );
  const [required, setRequired] = useState(initial?.required ?? false);
  const [optionsText, setOptionsText] = useState(
    (initial?.options ?? []).join(', ')
  );
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) {
      setError('Label is required');
      return;
    }
    const options =
      fieldType === 'dropdown'
        ? optionsText
            .split(',')
            .map((o) => o.trim())
            .filter(Boolean)
        : [];
    onSave({
      label: label.trim(),
      field_type: fieldType,
      required,
      options,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 p-3 bg-gray-50 border rounded"
    >
      <div>
        <label
          htmlFor="custom-field-label"
          className="block text-sm font-medium"
        >
          Label *
        </label>
        <input
          type="text"
          id="custom-field-label"
          data-testid="custom-field-label"
          placeholder="e.g. Budget Range"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="w-full p-2 border rounded"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
      <div>
        <label
          htmlFor="custom-field-type"
          className="block text-sm font-medium"
        >
          Type
        </label>
        <select
          id="custom-field-type"
          data-testid="custom-field-type"
          value={fieldType}
          onChange={(e) => setFieldType(e.target.value as CustomFieldType)}
          className="w-full p-2 border rounded"
        >
          {CUSTOM_FIELD_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          data-testid="custom-field-required"
          checked={required}
          onChange={(e) => setRequired(e.target.checked)}
        />
        Required
      </label>
      {fieldType === 'dropdown' && (
        <div>
          <label
            htmlFor="custom-field-options"
            className="block text-sm font-medium"
          >
            Options (comma-separated)
          </label>
          <input
            type="text"
            id="custom-field-options"
            data-testid="custom-field-options"
            placeholder="e.g. Low, Medium, High"
            value={optionsText}
            onChange={(e) => setOptionsText(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          data-testid="custom-field-save"
          disabled={saving}
          className={`px-4 py-2 text-white rounded ${
            saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600'
          }`}
        >
          {saving ? 'Saving...' : initial ? 'Save Changes' : 'Add Field'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
