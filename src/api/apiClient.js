import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const _client = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

_client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor unwraps response.data — typed wrappers below reflect this to TypeScript
_client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

/** @type {{ get(url: string, config?: import('axios').AxiosRequestConfig): Promise<any>, post(url: string, data?: any, config?: import('axios').AxiosRequestConfig): Promise<any>, put(url: string, data?: any, config?: import('axios').AxiosRequestConfig): Promise<any>, delete(url: string, config?: import('axios').AxiosRequestConfig): Promise<any> }} */
const apiClient = {
  get: (url, config) => _client.get(url, config),
  post: (url, data, config) => _client.post(url, data, config),
  put: (url, data, config) => _client.put(url, data, config),
  delete: (url, config) => _client.delete(url, config),
};

export default apiClient;
