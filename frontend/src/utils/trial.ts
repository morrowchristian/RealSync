// src/utils/trial.ts
// Trial-account limits and helpers for surfacing trial / quota state.
// Quota limits are per the backend contract: trial accounts are capped,
// non-trial (full) accounts are unlimited and show no quota text.

// Trial-account quotas.
export const LEAD_LIMIT = 50;
export const CONTRACT_LIMIT = 20;
export const CUSTOM_FIELD_LIMIT = 10;

export interface TrialInfo {
  is_trial?: boolean;
  trial_ends_at?: string | null;
  days_remaining?: number | null;
}

/**
 * Human-readable trial status for a trial account, or null when the
 * account is not a trial (callers then show nothing trial-related, or
 * "Full account").
 */
export function formatTrialStatus(trial: TrialInfo): string | null {
  if (!trial.is_trial) return null;
  if (typeof trial.days_remaining === 'number') {
    if (trial.days_remaining <= 0) return 'Trial expired';
    return `Trial ends in ${trial.days_remaining} day${trial.days_remaining === 1 ? '' : 's'}`;
  }
  if (trial.trial_ends_at) {
    const ms = new Date(trial.trial_ends_at).getTime() - Date.now();
    if (Number.isNaN(ms)) return 'Trial account';
    const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
    if (days <= 0) return 'Trial expired';
    return `Trial ends in ${days} day${days === 1 ? '' : 's'}`;
  }
  return 'Trial account';
}

/**
 * Pull a readable message out of an Axios / DRF error without ever
 * rendering raw JSON. DRF errors arrive as { detail: "..." },
 * { non_field_errors: ["..."] }, { message: "..." }, a plain string, or
 * per-field errors like { username: ["..."] }. Falls back to `fallback`
 * when nothing readable is present.
 */
export function extractErrorMessage(error: unknown, fallback: string): string {
  const data = (error as { response?: { data?: unknown } } | null)?.response
    ?.data;
  if (typeof data === 'string' && data.trim()) return data;
  if (data && typeof data === 'object') {
    const body = data as Record<string, unknown>;
    const firstString = (value: unknown): string | null => {
      if (typeof value === 'string' && value.trim()) return value;
      if (Array.isArray(value)) {
        const joined = value
          .filter((v): v is string => typeof v === 'string' && v.trim() !== '')
          .join(' ');
        return joined || null;
      }
      return null;
    };
    // Most specific first: detail / non_field_errors / message / error.
    for (const key of ['detail', 'non_field_errors', 'message', 'error']) {
      const message = firstString(body[key]);
      if (message) return message;
    }
    // Per-field errors, e.g. { username: ["A user with that username..."] }.
    const parts: string[] = [];
    for (const [key, value] of Object.entries(body)) {
      const message = firstString(value);
      if (message) parts.push(`${key}: ${message}`);
    }
    if (parts.length > 0) return parts.join(' ');
  }
  return fallback;
}
