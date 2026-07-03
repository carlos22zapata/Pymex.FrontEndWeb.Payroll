import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { STORAGE_KEYS } from '../lib/constants';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: { id: number; userName: string; roleName: string } | null;
  selectedEnterprise: { id: number; name: string; database: string } | null;
}

interface AuthContextType extends AuthState {
  logout: () => void;
}

const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
  selectedEnterprise: null,
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState);

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      try {
        const params = new URLSearchParams(hash);
        const token = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const userStr = params.get('user');
        const enterpriseStr = params.get('enterprise');

        if (token) {
          localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
          if (refreshToken) localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
          if (userStr) localStorage.setItem(STORAGE_KEYS.USER, userStr);
          if (enterpriseStr) localStorage.setItem(STORAGE_KEYS.ENTERPRISE, enterpriseStr);
          window.location.replace(window.location.pathname + window.location.search);
          return;
        }
      } catch {
        // ignore invalid hash
      }
    }

    const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
    const storedEnterprise = localStorage.getItem(STORAGE_KEYS.ENTERPRISE);

    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        if (token && user.id) {
          setState({
            isAuthenticated: true,
            isLoading: false,
            user,
            selectedEnterprise: storedEnterprise ? JSON.parse(storedEnterprise) : null,
          });
          return;
        }
      } catch {
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
        localStorage.removeItem(STORAGE_KEYS.ENTERPRISE);
      }
    }
    setState((prev) => ({ ...prev, isLoading: false }));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.ENTERPRISE);
    setState(initialState);
  }, []);

  const value = useMemo(() => ({ ...state, logout }), [state, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
