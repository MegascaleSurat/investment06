import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from "axios"

export const API_UNAUTHORIZED_EVENT = "api:unauthorized"

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api/v2",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
})

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token")
      window.dispatchEvent(new Event(API_UNAUTHORIZED_EVENT))
    }
    return Promise.reject(error)
  }
)

export default api

