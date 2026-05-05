import axios, { type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';
import { message } from 'antd';
import { useAuthStore } from '../store/useAuthStore';
import type { Result, LoginResponse } from '../types/auth';

export interface CustomRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  _skipErrorHandler?: boolean;
}

const BASE_URL = '/api';
const REFRESH_TOKEN_PATH = '/auth/refresh';

const request = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

let isRefreshing = false;
let pendingQueue: ((token: string) => void)[] = [];

const drainQueue = (token: string) => {
  pendingQueue.forEach((cb) => cb(token));
  pendingQueue = [];
};

const redirectToLogin = () => {
  useAuthStore.getState().clearAuth();
  window.location.replace('/login');
};

request.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

request.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config as CustomRequestConfig;

    if (error.response?.status === 401 && !originalRequest._retry) {
      const { refreshToken } = useAuthStore.getState();

      if (!refreshToken) {
        redirectToLogin();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          pendingQueue.push((newToken) => {
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            resolve(request(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post<Result<LoginResponse>>(
          `${BASE_URL}${REFRESH_TOKEN_PATH}`, 
          { refreshToken }
        );
        
        if (data.code === 200 && data.data) {
          const { accessToken: newAccessToken, refreshToken: newRefreshToken } = data.data;
          useAuthStore.getState().setTokens(newAccessToken, newRefreshToken);
          drainQueue(newAccessToken);
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
          return request(originalRequest);
        } else {
          throw new Error(data.message || '刷新令牌失败');
        }
      } catch {
        pendingQueue = [];
        redirectToLogin();
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    if (!originalRequest._skipErrorHandler) {
      const msg: string = error.response?.data?.message ?? error.message ?? '请求失败';
      message.error(msg);
    }
    return Promise.reject(error);
  },
);

export default request;
