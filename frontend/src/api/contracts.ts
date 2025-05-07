// src/api/contracts.ts
import api from './axios';

export async function fetchContracts() {
    return (await api.get('contracts/')).data;
  }
  
  export async function fetchContract(id: number) {
    return (await api.get(`contracts/${id}/`)).data;
  }
  
  export async function createContract(data: any) {
    return (await api.post('contracts/', data)).data;
  }
  
  export async function updateContract(id: number, data: any) {
    return (await api.put(`contracts/${id}/`, data)).data;
  }
  
  export async function deleteContract(id: number) {
    return (await api.delete(`contracts/${id}/`)).data;
  }
  