import api from './axios';
import handleRequest from '../utils/request';
import type { Contract } from '../types/contract';

// Fetch active (non-archived) contracts
export const fetchContracts = (): Promise<Contract[]> =>
  handleRequest(() =>
    api.get('contracts/').then(res => res.data),
    "Failed to fetch contracts"
  );

// Fetch all contracts (including archived)
export const fetchAllContracts = (): Promise<Contract[]> =>
  handleRequest(() =>
    api.get('contracts/?all=true').then(res => res.data),
    "Failed to fetch all contracts"
  );

// Fetch single contract by ID
export const fetchContract = (id: number): Promise<Contract> =>
  handleRequest(() =>
    api.get(`contracts/${id}/`).then(res => res.data),
    "Failed to fetch contract"
  );

// Create a new contract (with file upload support)
export const createContract = (data: FormData): Promise<Contract> =>
  handleRequest(() =>
    api.post('contracts/', data).then(res => res.data),
    "Failed to create contract"
  );

// Update an existing contract
export const updateContract = (id: number, data: FormData): Promise<Contract> =>
  handleRequest(() =>
    api.put(`contracts/${id}/`, data).then(res => res.data),
    "Failed to update contract"
  );

// Permanently delete a contract
export const deleteContract = (id: number): Promise<void> =>
  handleRequest(() =>
    api.delete(`contracts/${id}/`).then(res => res.data),
    "Failed to delete contract"
  );

// Archive a contract (soft delete)
export const archiveContract = (id: number): Promise<void> =>
  handleRequest(() =>
    api.post(`contracts/${id}/archive/`).then(res => res.data),
    "Failed to archive contract"
  );

// Restore an archived contract
export const restoreContract = (id: number): Promise<void> =>
  handleRequest(() =>
    api.post(`contracts/${id}/restore/`).then(res => res.data),
    "Failed to restore contract"
  );
