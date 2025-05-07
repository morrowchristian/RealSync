// src/api/leads.ts
import api from './axios';

export async function fetchLeads() {
    return (await api.get('leads/')).data;
  }
  
  export async function fetchLead(id: number) {
    return (await api.get(`leads/${id}/`)).data;
  }
  
  export async function createLead(data: any) {
    return (await api.post('leads/', data)).data;
  }
  
  export async function updateLead(id: number, data: any) {
    return (await api.put(`leads/${id}/`, data)).data;
  }
  
  export async function deleteLead(id: number) {
    return (await api.delete(`leads/${id}/`)).data;
  }
  
  