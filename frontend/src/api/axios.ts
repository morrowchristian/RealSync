// src/api/axios.ts
import axios, { type AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';

// The API base URL. Read from process.env so it works in both Vite and Jest:
// Vite injects `process.env.VITE_API_URL` via `define` in vite.config.ts
// (from the VITE_API_URL env var / .env file); Jest reads it from Node's
// process.env. `import.meta.env` is intentionally avoided here because
// Jest's CommonJS transform cannot parse `import.meta`.
//
// NOTE: Do NOT guard this with `typeof process !== 'undefined'`. Vite's
// `define` replaces the `process.env.VITE_API_URL` token with a string
// literal at build time, but a `typeof process` guard is NOT replaced —
// and `process` does not exist in the browser, so the guard was always
// false there and the app silently fell back to localhost:8000, making
// login fail against the deployed backend. In Jest (Node) `process`
// always exists, so the unguarded read is safe in both environments.
const apiBaseUrl =
  process.env.VITE_API_URL || 'http://localhost:8000/api/';

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: false,
});

// Attach the access token to every request
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const access = localStorage.getItem('access');
  if (access) {
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

// Requests marked as already retried after a token refresh
interface RetryableRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

function clearTokensAndRedirectToLogin() {
  localStorage.removeItem('access');
  localStorage.removeItem('refresh');
  window.location.href = '/login';
}

// On 401, try refreshing the access token once, then retry the original request.
// If the refresh fails, clear both tokens and redirect to /login.
api.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    const isAuthRequest =
      originalRequest?.url?.includes('token/') ?? false;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthRequest
    ) {
      originalRequest._retry = true;

      const refresh = localStorage.getItem('refresh');
      if (!refresh) {
        clearTokensAndRedirectToLogin();
        return Promise.reject(error);
      }

      try {
        // Use the bare axios instance (no interceptors) so the refresh
        // call itself can never trigger this interceptor again.
        const refreshResponse = await axios.post(
          `${api.defaults.baseURL}token/refresh/`,
          { refresh },
        );
        const newAccess = refreshResponse.data.access as string;
        localStorage.setItem('access', newAccess);

        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return api(originalRequest);
      } catch {
        clearTokensAndRedirectToLogin();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
