import { create } from 'zustand';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USERNAME: 'username',
} as const;

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  username: string | null;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUsername: (username: string) => void;
  clearAuth: () => void;
}

const getStorageItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const setStorageItem = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch {
    console.error(`无法保存 ${key} 到 localStorage`);
  }
};

const removeStorageItem = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch {
    console.error(`无法从 localStorage 删除 ${key}`);
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: getStorageItem(STORAGE_KEYS.ACCESS_TOKEN),
  refreshToken: getStorageItem(STORAGE_KEYS.REFRESH_TOKEN),
  username: getStorageItem(STORAGE_KEYS.USERNAME),

  setTokens: (accessToken, refreshToken) => {
    setStorageItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    setStorageItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    set({ accessToken, refreshToken });
  },

  setUsername: (username) => {
    setStorageItem(STORAGE_KEYS.USERNAME, username);
    set({ username });
  },

  clearAuth: () => {
    removeStorageItem(STORAGE_KEYS.ACCESS_TOKEN);
    removeStorageItem(STORAGE_KEYS.REFRESH_TOKEN);
    removeStorageItem(STORAGE_KEYS.USERNAME);
    set({ accessToken: null, refreshToken: null, username: null });
  },
}));

export const useIsAuthenticated = () => useAuthStore((state) => !!state.accessToken);
