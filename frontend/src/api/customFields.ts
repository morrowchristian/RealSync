import api from './axios';
import handleRequest from '../utils/request';
import type { CustomField } from '../types/customField';

export type CustomFieldPayload = Partial<
  Pick<
    CustomField,
    'label' | 'field_type' | 'required' | 'options' | 'order' | 'is_active'
  >
> & { name?: string };

// List the current agent's custom fields, ordered by `order` then `id`.
export const fetchCustomFields = (): Promise<CustomField[]> =>
  handleRequest(
    () => api.get('custom-fields/').then((res) => res.data),
    'Failed to fetch custom fields'
  );

// Create one custom field. `name` may be omitted — the backend slugifies
// it from the label.
export const createCustomField = (
  data: CustomFieldPayload
): Promise<CustomField> =>
  handleRequest(
    () => api.post('custom-fields/', data).then((res) => res.data),
    'Failed to create custom field'
  );

// Update a custom field (full or partial update).
export const updateCustomField = (
  id: number,
  data: CustomFieldPayload
): Promise<CustomField> =>
  handleRequest(
    () => api.patch(`custom-fields/${id}/`, data).then((res) => res.data),
    'Failed to update custom field'
  );

// Hard-delete a custom field.
export const deleteCustomField = (id: number): Promise<void> =>
  handleRequest(
    () => api.delete(`custom-fields/${id}/`).then((res) => res.data),
    'Failed to delete custom field'
  );
