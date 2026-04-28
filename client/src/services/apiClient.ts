import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request Interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Handle unauthorized (e.g., logout user or refresh token)
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    const data = error.response?.data as unknown;

    const getMessage = (value: unknown): string | undefined => {
      if (!value || typeof value !== 'object') return undefined;
      const obj = value as Record<string, unknown>;
      if (typeof obj.message === 'string') return obj.message;
      if (obj.error && typeof obj.error === 'object') {
        const errObj = obj.error as Record<string, unknown>;
        if (typeof errObj.message === 'string') return errObj.message;
      }
      return undefined;
    };

    const message = getMessage(data) || 'Something went wrong';
    console.error(`[API Error]: ${message}`);

    return Promise.reject(error);
  }
);

export default apiClient;
