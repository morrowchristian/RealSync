import api from './axios';
import handleRequest from '../utils/request';
import type { Estimate } from '../types/estimate';

// Fetch all estimates
export const fetchEstimates = (): Promise<Estimate[]> =>
  handleRequest(() =>
    api.get('estimates/').then(res => res.data),
    "Failed to fetch estimates"
  );

// Fetch a single estimate by ID
export const fetchEstimate = (id: number): Promise<Estimate> =>
  handleRequest(() =>
    api.get(`estimates/${id}/`).then(res => res.data),
    "Failed to fetch estimate"
  );

// Create a new estimate (silent: EstimateForm owns the error display and
// toasts the backend's plain message, e.g. a trial quota error, itself).
export const createEstimate = (
  data: Partial<Estimate>
): Promise<Estimate> =>
  handleRequest(
    () => api.post('estimates/', data).then(res => res.data),
    "Failed to create estimate",
    { silent: true }
  );

// Update an existing estimate (silent: see createEstimate).
export const updateEstimate = (
  id: number,
  data: Partial<Estimate>
): Promise<Estimate> =>
  handleRequest(
    () => api.put(`estimates/${id}/`, data).then(res => res.data),
    "Failed to update estimate",
    { silent: true }
  );

// Permanently delete an estimate
export const deleteEstimate = (id: number): Promise<void> =>
  handleRequest(() =>
    api.delete(`estimates/${id}/`).then(res => res.data),
    "Failed to delete estimate"
  );
