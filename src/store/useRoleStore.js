import { create } from 'zustand';
import axios from 'axios';
import { API_CONFIG } from '../constants/Config';
import AuthService from '../services/AuthService';

const useRoleStore = create((set, get) => ({
    roles: [],
    hasManagerRole: false,
    hasEmployeeRole: false,
    activeTab: 'Self', // 'Self' or 'Team'
    loadingRoles: false,
    error: null,

    fetchRoles: async (userId) => {
        set({ loadingRoles: true, error: null });
        try {
            const token = await AuthService.getBackendToken();
            const response = await axios.get(`${API_CONFIG.BASE_URL}/user-roles/user/${userId}/individual-roles`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            const rolesData = response.data?.availableRolesWithUserStatus || [];
            
            const hasManager = rolesData.some(r => r.roleName === 'Manager' && r.doesUserHaveThisRole === true);
            const hasEmployee = rolesData.some(r => r.roleName === 'Employee' && r.doesUserHaveThisRole === true);

            set({
                roles: rolesData,
                hasManagerRole: hasManager,
                hasEmployeeRole: hasEmployee,
                loadingRoles: false
            });
        } catch (error) {
            console.error('Error fetching roles:', error);
            set({ error: error.message, loadingRoles: false });
        }
    },

    setActiveTab: (tab) => set({ activeTab: tab })
}));

export default useRoleStore;
