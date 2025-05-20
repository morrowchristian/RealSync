// frontend/src/types/contract.ts
export interface Contract {
  id: number;
  lead: number;
  status: 'pending' | 'signed' | 'voided';
  document: string;
  is_archived: boolean;
  created_at: string;
}
