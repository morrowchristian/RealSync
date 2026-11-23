// frontend/src/pages/SettingsPage.tsx
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axios';
import { logout } from '../utils/auth';
import {
  createCustomField,
  deleteCustomField,
  fetchCustomFields,
  updateCustomField,
  type CustomFieldPayload,
} from '../api/customFields';
import {
  getLeadFormSettings,
  updateLeadFormSettings,
} from '../api/leadFormSettings';
import {
  CONFIGURABLE_LEAD_FIELDS,
  DEFAULT_FIELD_CONFIG,
  mergeFieldConfig,
  type CustomField,
  type FieldConfigMap,
} from '../types/customField';
import CustomFieldForm from '../components/forms/CustomFieldForm';
import ConfirmDialog from '../components/ui/ConfirmDialog';

interface AgentProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  brokerage: string;
}

// The backend has no /agents/me/ endpoint — the agents list/detail endpoints
// are the only user endpoints. Login stores only the access/refresh tokens,
// so the current agent is identified from the `user_id` claim in the
// SimpleJWT access token, then fetched via GET agents/{id}/.
function getCurrentUserId(): number | null {
  try {
    const token = localStorage.getItem('access');
    if (!token) return null;
    const payload = token.split('.')[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const decoded = JSON.parse(atob(padded));
    return typeof decoded.user_id === 'number' ? decoded.user_id : null;
  } catch {
    return null;
  }
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  // --- Lead Form preferences (custom fields + built-in field toggles) ---
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [fieldsLoading, setFieldsLoading] = useState(true);
  // 'new' = adding, a field = editing it, null = no editor open.
  const [editor, setEditor] = useState<'new' | CustomField | null>(null);
  const [savingField, setSavingField] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CustomField | null>(null);
  const [fieldConfig, setFieldConfig] =
    useState<FieldConfigMap>(DEFAULT_FIELD_CONFIG);
  const [savingConfig, setSavingConfig] = useState(false);

  const refreshCustomFields = async () => {
    try {
      setCustomFields(await fetchCustomFields());
    } catch {
      // fetchCustomFields already toasts the failure.
    } finally {
      setFieldsLoading(false);
    }
  };

  useEffect(() => {
    refreshCustomFields();
    getLeadFormSettings()
      .then((settings) =>
        setFieldConfig(mergeFieldConfig(settings?.field_config))
      )
      // Fall back to the defaults if the fetch fails; the form still works.
      .catch(() => setFieldConfig(DEFAULT_FIELD_CONFIG));
  }, []);

  const handleSaveCustomField = async (data: CustomFieldPayload) => {
    setSavingField(true);
    try {
      if (editor && editor !== 'new') {
        await updateCustomField(editor.id, data);
        toast.success('Custom field updated');
      } else {
        await createCustomField(data);
        toast.success('Custom field added');
      }
      setEditor(null);
      await refreshCustomFields();
    } catch {
      // The api layer already toasts the failure.
    } finally {
      setSavingField(false);
    }
  };

  const handleDeleteCustomField = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCustomField(deleteTarget.id);
      toast.success('Custom field deleted');
      setDeleteTarget(null);
      await refreshCustomFields();
    } catch {
      // The api layer already toasts the failure.
    }
  };

  const handleSaveFieldConfig = async () => {
    setSavingConfig(true);
    try {
      const saved = await updateLeadFormSettings(fieldConfig);
      setFieldConfig(mergeFieldConfig(saved?.field_config));
      toast.success('Lead form settings saved');
    } catch {
      // The api layer already toasts the failure.
    } finally {
      setSavingConfig(false);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      const userId = getCurrentUserId();
      if (userId === null) {
        setLoadFailed(true);
        setLoading(false);
        return;
      }
      try {
        const res = await api.get<AgentProfile>(`agents/${userId}/`);
        setProfile(res.data);
      } catch {
        setLoadFailed(true);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const fields: { label: string; value: string }[] = profile
    ? [
        { label: 'Username', value: profile.username },
        { label: 'Email', value: profile.email },
        { label: 'First name', value: profile.first_name },
        { label: 'Last name', value: profile.last_name },
        { label: 'Phone', value: profile.phone },
        { label: 'Brokerage', value: profile.brokerage },
      ]
    : [];

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Link to="/leads" className="inline-block text-blue-500 underline">
        &larr; Back to Leads
      </Link>

      {loading ? (
        <p className="text-gray-600">Loading profile...</p>
      ) : profile ? (
        <div className="p-4 bg-white rounded shadow space-y-2">
          <h2 className="text-lg font-semibold">Profile</h2>
          {fields.map((field) => (
            <p key={field.label} className="text-sm">
              <span className="font-semibold">{field.label}: </span>
              <span className="text-gray-600">{field.value || '—'}</span>
            </p>
          ))}
          <p className="text-sm text-gray-500">
            Profile editing is not yet available.
          </p>
        </div>
      ) : (
        loadFailed && (
          <p className="text-gray-600">
            Could not load your profile. Try logging out and signing in again.
          </p>
        )
      )}

      <button
        onClick={handleLogout}
        className="px-4 py-2 bg-red-600 text-white rounded"
      >
        Log Out
      </button>

      {/* Lead Form preferences */}
      <div className="p-4 bg-white rounded shadow space-y-4">
        <h2 className="text-lg font-semibold">Lead Form</h2>
        <p className="text-sm text-gray-500">
          Control which fields appear on the lead form and add your own
          custom fields. Full name, email and status always appear.
        </p>

        {/* Built-in field toggles */}
        <div className="space-y-2">
          <h3 className="font-semibold">Built-in fields</h3>
          {CONFIGURABLE_LEAD_FIELDS.map(({ key, label }) => (
            <div
              key={key}
              className="flex items-center gap-4 text-sm border-b border-gray-100 py-2"
            >
              <span className="w-36 font-medium">{label}</span>
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  data-testid={`field-toggle-${key}-visible`}
                  checked={fieldConfig[key].visible}
                  onChange={(e) =>
                    setFieldConfig((prev) => ({
                      ...prev,
                      [key]: { ...prev[key], visible: e.target.checked },
                    }))
                  }
                />
                Show
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  data-testid={`field-toggle-${key}-required`}
                  checked={fieldConfig[key].required}
                  onChange={(e) =>
                    setFieldConfig((prev) => ({
                      ...prev,
                      [key]: { ...prev[key], required: e.target.checked },
                    }))
                  }
                />
                Required
              </label>
            </div>
          ))}
          <button
            onClick={handleSaveFieldConfig}
            data-testid="save-field-config"
            disabled={savingConfig}
            className={`px-4 py-2 text-white rounded ${
              savingConfig ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600'
            }`}
          >
            {savingConfig ? 'Saving...' : 'Save Field Settings'}
          </button>
        </div>

        {/* Custom fields manager */}
        <div className="space-y-2">
          <h3 className="font-semibold">Custom fields</h3>
          {fieldsLoading ? (
            <p className="text-sm text-gray-600">Loading custom fields...</p>
          ) : customFields.length === 0 ? (
            <p className="text-sm text-gray-600">
              No custom fields yet. Add one below.
            </p>
          ) : (
            <ul className="space-y-2">
              {customFields.map((field) => (
                <li
                  key={field.id}
                  className="flex items-center gap-3 p-2 border rounded text-sm"
                >
                  <span className="font-medium">{field.label}</span>
                  <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-600">
                    {field.field_type}
                  </span>
                  {field.required && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                      Required
                    </span>
                  )}
                  {!field.is_active && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded">
                      Inactive
                    </span>
                  )}
                  <span className="ml-auto flex gap-2">
                    <button
                      onClick={() => {
                        setDeleteTarget(null);
                        setEditor(field);
                      }}
                      className="px-3 py-1 bg-yellow-500 text-white rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setEditor(null);
                        setDeleteTarget(field);
                      }}
                      className="px-3 py-1 bg-red-600 text-white rounded"
                    >
                      Delete
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}

          {deleteTarget && (
            <ConfirmDialog
              message={`Delete the custom field "${deleteTarget.label}"? This cannot be undone.`}
              confirmLabel="Yes, delete"
              variant="danger"
              onConfirm={handleDeleteCustomField}
              onCancel={() => setDeleteTarget(null)}
            />
          )}

          {editor ? (
            <CustomFieldForm
              initial={editor === 'new' ? null : editor}
              saving={savingField}
              onSave={handleSaveCustomField}
              onCancel={() => setEditor(null)}
            />
          ) : (
            <button
              onClick={() => {
                setDeleteTarget(null);
                setEditor('new');
              }}
              data-testid="add-custom-field"
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              + Add Custom Field
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
