import api from './axios';
import handleRequest from '../utils/request';
import type { Lead } from '../types/lead';

// Fetch only active (non-archived) leads
export const fetchLeads = (): Promise<Lead[]> =>
  handleRequest(() =>
    api.get('leads/').then(res => res.data),
    "Failed to fetch leads"
  );

// Fetch a single lead by ID
export const fetchLead = (id: number): Promise<Lead> =>
  handleRequest(() =>
    api.get(`leads/${id}/`).then(res => res.data),
    "Failed to fetch lead"
  );

// Create a new lead
export const createLead = (data: Partial<Lead>): Promise<Lead> =>
  handleRequest(() =>
    api.post('leads/', data).then(res => res.data),
    "Failed to create lead"
  );

// Update an existing lead
export const updateLead = (id: number, data: Partial<Lead>): Promise<Lead> =>
  handleRequest(() =>
    api.put(`leads/${id}/`, data).then(res => res.data),
    "Failed to update lead"
  );

// Permanently delete a lead
export const deleteLead = (id: number): Promise<void> =>
  handleRequest(() =>
    api.delete(`leads/${id}/`).then(res => res.data),
    "Failed to delete lead"
  );

// Fetch all leads including archived
export const fetchAllLeads = (): Promise<Lead[]> =>
  handleRequest(() =>
    api.get('leads/?all=true').then(res => res.data),
    "Failed to fetch all leads"
  );

// Archive a lead (soft delete)
export const archiveLead = (id: number): Promise<void> =>
  handleRequest(() =>
    api.post(`leads/${id}/archive/`).then(res => res.data),
    "Failed to archive lead"
  );

// Restore an archived lead
export const restoreLead = (id: number): Promise<void> =>
  handleRequest(() =>
    api.post(`leads/${id}/restore/`).then(res => res.data),
    "Failed to restore lead"
  );
