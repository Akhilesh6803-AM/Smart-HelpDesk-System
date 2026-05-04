import axios from 'axios';

// Use relative URLs so ALL requests go through the Vite dev proxy on port 3000.
// In production, set VITE_API_URL to your deployed backend URL.
const api = axios.create({
  baseURL: import.meta.env.MODE === 'development' ? '' : (import.meta.env.VITE_API_URL || ''),
  withCredentials: true,
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect to /auth on 401 if:
    // 1. We're not already on /auth
    // 2. The request was NOT to an auth endpoint (login/register should show errors, not redirect)
    const requestUrl = error.config?.url || '';
    const isAuthRequest = requestUrl.includes('/auth/');
    if (
      error.response &&
      error.response.status === 401 &&
      !isAuthRequest &&
      window.location.pathname !== '/auth'
    ) {
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

export default api;
