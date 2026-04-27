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

    const message = (error.response?.data as any)?.message || 'Something went wrong';
    console.error(`[API Error]: ${message}`);

    return Promise.reject(error);
  }
);

export default apiClient;
