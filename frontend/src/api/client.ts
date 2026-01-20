import axios from 'axios';

// Use environment variable or fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
    baseURL: API_BASE_URL,
});

// Request interceptor for adding auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        console.log(`[API DEBUG] Request to: ${config.url}, hasToken: ${!!token}`);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        console.error('[API DEBUG] Request Error:', error);
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => {
        console.log(`[API DEBUG] Success: ${response.config.url} (${response.status})`);
        return response;
    },
    (error) => {
        console.error(`[API DEBUG] Error: ${error.config?.url}`, {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
            isCors: error.code === 'ERR_NETWORK'
        });
        return Promise.reject(error);
    }
);

export default api;
