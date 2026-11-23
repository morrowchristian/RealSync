// src/api/auth.ts
import api from './axios';
import handleRequest from '../utils/request';

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  id: number;
  username: string;
  email: string;
  is_trial: boolean;
  trial_ends_at: string | null;
  access: string;
  refresh: string;
}

// Create a new account (public — no token needed). On success the
// response carries access/refresh tokens, so the caller can log the
// user straight in without a second login request.
export const register = (data: RegisterPayload): Promise<RegisterResponse> =>
  handleRequest(
    () => api.post('register/', data).then((res) => res.data),
    'Failed to create account'
  );
