import axios from 'axios';
import { API_CONFIG } from '../constants/Config';
import AuthService from '../services/AuthService';

const apiClient = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: 10000,
});

apiClient.interceptors.request.use(
    async (config) => {
        // Use the backend JWT for all future API calls
        const token = await AuthService.getBackendToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default apiClient;

