// Types for the agent-defined custom lead fields and the per-field
// visibility/required preferences for the built-in lead form fields.
// These mirror the backend contract:
//   GET /api/custom-fields/ and GET/PUT /api/lead-form-settings/

export type CustomFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'email'
  | 'phone'
  | 'dropdown'
  | 'checkbox';

export const CUSTOM_FIELD_TYPES: CustomFieldType[] = [
  'text',
  'textarea',
  'number',
  'date',
  'email',
  'phone',
  'dropdown',
  'checkbox',
];

export interface CustomField {
  id: number;
  agent: number;
  name: string;
  label: string;
  field_type: CustomFieldType;
  required: boolean;
  options: string[];
  order: number;
  is_active: boolean;
}

// Built-in lead fields whose visibility/required-ness an admin can configure.
// full_name, email and status are NOT configurable — always visible
// (full_name and email always required).
export type ConfigurableLeadField =
  | 'company'
  | 'lead_source'
  | 'notes'
  | 'preferred_contact'
  | 'phone'
  | 'property_address';

export const CONFIGURABLE_LEAD_FIELDS: {
  key: ConfigurableLeadField;
  label: string;
}[] = [
  { key: 'company', label: 'Company' },
  { key: 'lead_source', label: 'Lead Source' },
  { key: 'notes', label: 'Notes' },
  { key: 'preferred_contact', label: 'Preferred Contact' },
  { key: 'phone', label: 'Phone' },
  { key: 'property_address', label: 'Job Site Address' },
];

export interface FieldConfig {
  visible: boolean;
  required: boolean;
}

export type FieldConfigMap = Record<ConfigurableLeadField, FieldConfig>;

export interface LeadFormSettings {
  field_config: FieldConfigMap;
}

// Defaults the backend merges the stored config over: everything visible,
// only property_address required.
export const DEFAULT_FIELD_CONFIG: FieldConfigMap = {
  company: { visible: true, required: false },
  lead_source: { visible: true, required: false },
  notes: { visible: true, required: false },
  preferred_contact: { visible: true, required: false },
  phone: { visible: true, required: false },
  property_address: { visible: true, required: true },
};

// Merge a (possibly partial) stored config over the defaults, so a missing
// key or a failed fetch still leaves the form usable.
export function mergeFieldConfig(
  stored?: Partial<FieldConfigMap> | null
): FieldConfigMap {
  const merged = { ...DEFAULT_FIELD_CONFIG } as FieldConfigMap;
  if (stored) {
    (Object.keys(DEFAULT_FIELD_CONFIG) as ConfigurableLeadField[]).forEach(
      (key) => {
        if (stored[key]) {
          merged[key] = { ...DEFAULT_FIELD_CONFIG[key], ...stored[key] };
        }
      }
    );
  }
  return merged;
}
