// src/api/axios.ts
import axios from 'axios';
import { toast } from 'react-toastify';

const api = axios.create({
  baseURL: 'http://localhost:8000/api/',
  withCredentials: false,
});

// Add a response interceptor
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      toast.error("Session expired. Please log in again.");
      // Optionally redirect or clear auth state
      // window.location.href = '/login'; 
    }

    return Promise.reject(error); // still propagate to catch blocks
  }
);

export default api;
