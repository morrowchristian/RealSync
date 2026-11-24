// frontend/src/types/followUp.ts
export interface FollowUp {
  id: number;
  lead: number | null;
  estimate: number | null;
  title: string;
  /** YYYY-MM-DD */
  due_date: string;
  completed: boolean;
  notes: string;
  created_at: string;
}
