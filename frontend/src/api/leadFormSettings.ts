import api from './axios';
import handleRequest from '../utils/request';
import type { FieldConfigMap, LeadFormSettings } from '../types/customField';

// Fetch the stored lead-form field config (merged over defaults by the
// backend). Returns the full `{ field_config: {...} }` shape.
export const getLeadFormSettings = (): Promise<LeadFormSettings> =>
  handleRequest(
    () => api.get('lead-form-settings/').then((res) => res.data),
    'Failed to load lead form settings'
  );

// Persist a (possibly partial) field config. Returns the merged shape.
export const updateLeadFormSettings = (
  fieldConfig: Partial<FieldConfigMap>
): Promise<LeadFormSettings> =>
  handleRequest(
    () =>
      api
        .put('lead-form-settings/', { field_config: fieldConfig })
        .then((res) => res.data),
    'Failed to save lead form settings'
  );
