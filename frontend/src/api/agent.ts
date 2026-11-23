// src/api/agent.ts
import api from './axios';

// The backend has no /agents/me/ endpoint — the agents list/detail
// endpoints are the only user endpoints. Login stores only the
// access/refresh tokens, so the current agent is identified from the
// `user_id` claim in the SimpleJWT access token, then fetched via
// GET agents/{id}/.
export function getCurrentUserId(): number | null {
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

export interface AgentProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  brokerage: string;
  // Trial fields (present on the Agent detail response).
  is_trial?: boolean;
  trial_ends_at?: string | null;
  days_remaining?: number | null;
}

// Fetch the signed-in agent's profile, or null when there is no token
// (public pages) or the fetch fails. Callers treat null as "unknown —
// show no trial/quota text" rather than an error.
export const fetchCurrentAgent = async (): Promise<AgentProfile | null> => {
  const userId = getCurrentUserId();
  if (userId === null) return null;
  try {
    const res = await api.get<AgentProfile>(`agents/${userId}/`);
    return res.data;
  } catch {
    return null;
  }
};
