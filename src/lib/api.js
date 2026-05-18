import axios from 'axios';

export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: `${apiBaseUrl}/api`,
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

export async function getCsrfCookie() {
  await axios.get(`${apiBaseUrl}/sanctum/csrf-cookie`, {
    withCredentials: true,
    headers: {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
  });
}

export default api;
