// src/api/demo.ts
import api from './axios';
import handleRequest from '../utils/request';

// Shapes returned by the public GET /api/demo/ endpoint. Demo leads use
// `name` (not `full_name`) and demo contracts carry `lead_name`.
export interface DemoLead {
  id: number;
  name: string;
  email: string;
  phone: string;
  property_address: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  company?: string;
  lead_source?: string;
  notes?: string;
  preferred_contact?: string;
  created_at: string;
}

export interface DemoContract {
  id: number;
  lead_name: string;
  status: 'pending' | 'signed' | 'voided';
  created_at: string;
}

export interface DemoStats {
  total_leads: number;
  active_leads: number;
  total_contracts: number;
  pending_signature: number;
  leads_by_status: {
    new: number;
    contacted: number;
    qualified: number;
    converted: number;
    lost: number;
  };
}

export interface DemoData {
  leads: DemoLead[];
  contracts: DemoContract[];
  stats: DemoStats;
}

// Fetch the public read-only demo payload. No token is sent when none is
// stored (the shared api instance only attaches an Authorization header
// when localStorage holds an access token).
export const fetchDemo = (): Promise<DemoData> =>
  handleRequest(
    () => api.get('demo/').then((res) => res.data),
    'Failed to load demo'
  );
