import api from './axios';
import handleRequest from '../utils/request';
import type { FieldConfigMap, LeadFormSettings } from '../types/customField';

// Fetch the stored lead-form field config (merged over defaults by the
// backend). Returns the full `{ field_config: {...} }` shape.
// `opts.silent` skips the error toast — used when the caller retries the
// fetch itself and only wants to report the final failure.
export const getLeadFormSettings = (
  opts?: { silent?: boolean }
): Promise<LeadFormSettings> =>
  handleRequest(
    () => api.get('lead-form-settings/').then((res) => res.data),
    'Failed to load lead form settings',
    opts
  );

// Persist a (possibly partial) field config. Returns the merged shape.
export const updateLeadFormSettings = (
  fieldConfig: Partial<FieldConfigMap>,
  opts?: { silent?: boolean }
): Promise<LeadFormSettings> =>
  handleRequest(
    () =>
      api
        .put('lead-form-settings/', { field_config: fieldConfig })
        .then((res) => res.data),
    'Failed to save lead form settings',
    opts
  );
