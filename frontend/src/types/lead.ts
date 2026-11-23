export interface Lead {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  property_address: string;
  status: 'new' | 'contacted' | 'qualified' | 'lost' | 'converted';
  agent: number;
  created_at: string;
  is_archived: boolean;
  company?: string;
  lead_source?: string;
  notes?: string;
  preferred_contact?: string;
  custom_data?: Record<string, any>;
}
