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

            const hasAdmin = rolesData?.some(r => r.roleName === 'Admin' && r.doesUserHaveThisRole === true);
            const hasManager = rolesData.some(r => r.roleName === 'Manager' && r.doesUserHaveThisRole === true);
            const hasEmployee = rolesData.some(r => r.roleName === 'Employee' && r.doesUserHaveThisRole === true);

            const updateState = {
                roles: rolesData,
                hasManagerRole: hasManager,
                hasEmployeeRole: hasEmployee,
                hasAdminRole: hasAdmin,
                loadingRoles: false,
            };

            // Ensure activeTab falls back to 'Self' if they are no longer a manager
            if (!hasManager) {
                updateState.activeTab = 'Self';
            }

            set(updateState);
        } catch (error) {
            console.error('Error fetching roles:', error);
            set({ error: error.message, loadingRoles: false });
        }
    },

    setActiveTab: (tab) => set({ activeTab: tab }),

    clearRoles: () => set({
        roles: [],
        hasManagerRole: false,
        hasEmployeeRole: false,
        hasAdminRole: false,
        activeTab: 'Self',
        loadingRoles: false,
        error: null,
    })
}));

export default useRoleStore;
