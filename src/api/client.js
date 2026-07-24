import axios from 'axios';
import { API_CONFIG } from '../constants/Config';
import AuthService from '../services/AuthService';

const apiClient = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: 10000,
});

apiClient.interceptors.request.use(
    async (config) => {
        // Attach backend JWT to every outgoing request
        const token = await AuthService.getBackendToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ─── 401 Response Interceptor ─────────────────────────────────────────────────
// When the backend returns 401 (token expired / invalid), clear stored
// credentials so screens that call AuthService.isAuthenticated() on focus
// will automatically redirect the user to the Login screen.
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            try {
                await AuthService.signOut();
            } catch (_) {
                // Ignore cleanup errors – sign-out is best-effort
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;

