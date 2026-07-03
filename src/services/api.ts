import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { STORAGE_KEYS, AUTH_BASE_URL, API_BASE_URL } from '../lib/constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

const getAccessToken = () => localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
const getRefreshToken = () => localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

const saveTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
};

const clearTokens = () => {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
  localStorage.removeItem(STORAGE_KEYS.ENTERPRISE);
};

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token.replace('Bearer ', '')}`;
    }
    const enterpriseStr = localStorage.getItem(STORAGE_KEYS.ENTERPRISE);
    if (enterpriseStr) {
      try {
        const enterprise = JSON.parse(enterpriseStr);
        if (enterprise.database) {
          config.headers.ConexName = enterprise.database;
        }
      } catch {
        // Invalid JSON stored for enterprise, ignore
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 400) {
      console.log('[API 400] URL:', error.config?.url);
      console.log('[API 400] Body:', JSON.stringify(error.response.data, null, 2));
    }

    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      clearTokens();
      window.location.href = 'http://localhost:7200';
      return Promise.reject(error);
    }

    try {
      const response = await axios.post(`${AUTH_BASE_URL}/api/Access/RefreshToken`, {
        refreshToken,
      });

      const result = response.data;
      if (!result.isSuccess || !result.value) {
        throw new Error(result.errorMessage || 'Invalid refresh response');
      }

      const { token, refreshToken: newRefreshToken } = result.value;

      if (!token) {
        throw new Error('No token in refresh response');
      }

      saveTokens(token, newRefreshToken);
      processQueue(null, token);

      originalRequest.headers.Authorization = `Bearer ${token.replace('Bearer ', '')}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      clearTokens();
      window.location.href = 'http://localhost:7200';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export { api, getAccessToken, getRefreshToken, saveTokens, clearTokens };
