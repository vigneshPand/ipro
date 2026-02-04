import { authorize } from 'react-native-app-auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import axios from 'axios';
import { AZURE_CONFIG, API_CONFIG } from '../constants/Config';

class AuthService {
    async login() {
        try {
            const result = await authorize(AZURE_CONFIG);

            if (result && result.accessToken) {
                // Return ONLY the access token as requested
                return result.accessToken;
            }
            throw new Error('No access token received from Azure');
        } catch (error) {
            console.error('Azure Login Error:', error);
            throw error;
        }
    }

    async exchangeToken(azureToken) {
        try {
            const response = await axios.post(`${API_CONFIG.BASE_URL}/auth/mobile/token-exchange`, {
                azureToken: azureToken
            });

            if (response.data && response.data.accessToken) {
                const { accessToken } = response.data;

                // Securely store the backend accessToken
                if (Keychain && typeof Keychain.setGenericPassword === 'function') {
                    await Keychain.setGenericPassword('backend_token', accessToken, {
                        service: 'ipro_backend_service'
                    });
                } else {
                    console.error('Keychain not available');
                    throw new Error('Secure storage not available');
                }

                return response.data;
            }
            throw new Error('Invalid response from token exchange');
        } catch (error) {
            console.error('Token Exchange Error:', error);
            throw error;
        }
    }

    async getAuthenticatedUser() {
        try {
            const token = await this.getBackendToken();
            if (!token) throw new Error('No backend token found');

            const response = await axios.get(`${API_CONFIG.BASE_URL}/userMasterController/getAutenticatedUser`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data) {
                const user = response.data;
                // Store the whole response object as a JSON string
                await AsyncStorage.setItem('user_profile', JSON.stringify(user));
                return user;
            }
            throw new Error('Failed to fetch user profile');
        } catch (error) {
            console.error('Fetch Authenticated User Error:', error);
            throw error;
        }
    }

    async signOut() {
        try {
            if (Keychain && typeof Keychain.resetGenericPassword === 'function') {
                await Keychain.resetGenericPassword({ service: 'ipro_backend_service' });
            }
            await AsyncStorage.removeItem('user_profile');
        } catch (error) {
            console.error('Logout Error:', error);
        }
    }

    async getBackendToken() {
        try {
            if (!Keychain || typeof Keychain.getGenericPassword !== 'function') {
                console.error('Keychain native module is not available.');
                return null;
            }
            const credentials = await Keychain.getGenericPassword({ service: 'ipro_backend_service' });
            return credentials ? credentials.password : null;
        } catch (error) {
            console.error('Error retrieving token from Keychain:', error);
            return null;
        }
    }

    async getUserInfo() {
        try {
            const profile = await AsyncStorage.getItem('user_profile');
            return profile ? JSON.parse(profile) : null;
        } catch (error) {
            console.error('Error parsing user profile:', error);
            return null;
        }
    }

    async isAuthenticated() {
        const token = await this.getBackendToken();
        return !!token;
    }
}

export default new AuthService();
