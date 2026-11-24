// frontend/src/types/estimate.ts
export interface Estimate {
  id: number;
  lead: number;
  title: string;
  description: string;
  /** Decimal, serialized by the backend as a string. */
  amount: string | null;
  status: 'sent' | 'followed_up' | 'won' | 'lost';
  date_sent: string | null;
  notes: string;
  created_at: string;
}

export const ESTIMATE_STATUS_OPTIONS: { value: Estimate['status']; label: string }[] = [
  { value: 'sent', label: 'Sent' },
  { value: 'followed_up', label: 'Followed up' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
];

export function estimateStatusLabel(value?: string | null): string {
  if (!value) return '—';
  return ESTIMATE_STATUS_OPTIONS.find((o) => o.value === value)?.label ?? value;
}
