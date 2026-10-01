export const API_BASE_URL = import.meta.env.VITE_PAYROLL_API_URL ?? 'http://localhost:7600';
export const AUTH_API_BASE_URL = import.meta.env.VITE_AUTH_API_URL ?? 'http://localhost:7010';
export const AUTH_PORTAL_URL = import.meta.env.VITE_AUTH_PORTAL_URL ?? 'http://localhost:7200';

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'pymex_access_token',
  REFRESH_TOKEN: 'pymex_refresh_token',
  USER: 'pymex_user',
  ENTERPRISE: 'pymex_enterprise',
  APPEARANCE: 'pymex_appearance',
} as const;
