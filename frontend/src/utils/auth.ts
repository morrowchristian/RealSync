// src/utils/auth.ts
export function logout() {
  localStorage.removeItem('access');
  localStorage.removeItem('refresh');
}
