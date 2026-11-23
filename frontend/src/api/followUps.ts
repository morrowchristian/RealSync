import api from './axios';
import handleRequest from '../utils/request';
import type { FollowUp } from '../types/followUp';

// Fetch all follow-ups
export const fetchFollowUps = (): Promise<FollowUp[]> =>
  handleRequest(() =>
    api.get('follow-ups/').then(res => res.data),
    "Failed to fetch follow-ups"
  );

// Fetch a single follow-up by ID
export const fetchFollowUp = (id: number): Promise<FollowUp> =>
  handleRequest(() =>
    api.get(`follow-ups/${id}/`).then(res => res.data),
    "Failed to fetch follow-up"
  );

// Create a new follow-up (silent: FollowUpForm owns the error display and
// toasts the backend's plain message itself).
export const createFollowUp = (
  data: Partial<FollowUp>
): Promise<FollowUp> =>
  handleRequest(
    () => api.post('follow-ups/', data).then(res => res.data),
    "Failed to create follow-up",
    { silent: true }
  );

// Update an existing follow-up (silent: see createFollowUp).
export const updateFollowUp = (
  id: number,
  data: Partial<FollowUp>
): Promise<FollowUp> =>
  handleRequest(
    () => api.patch(`follow-ups/${id}/`, data).then(res => res.data),
    "Failed to update follow-up",
    { silent: true }
  );

// Mark a follow-up done (or undo it) via a partial update.
export const toggleFollowUp = (
  id: number,
  completed: boolean
): Promise<FollowUp> => updateFollowUp(id, { completed });

// Permanently delete a follow-up
export const deleteFollowUp = (id: number): Promise<void> =>
  handleRequest(() =>
    api.delete(`follow-ups/${id}/`).then(res => res.data),
    "Failed to delete follow-up"
  );
