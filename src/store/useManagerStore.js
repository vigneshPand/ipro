import { create } from 'zustand';
import LeaveService from '../services/LeaveService';

const useManagerStore = create((set, get) => ({
    managers: [],
    loadingManagers: false,
    
    fetchManagers: async (userId) => {
        // Only fetch if not already populated to avoid repeated calls
        if (get().managers.length > 0) return;
        
        set({ loadingManagers: true });
        try {
            const data = await LeaveService.getManagersDropDown(userId);
            if (data && Array.isArray(data)) {
                // Assuming data items have { userId, displayName, mail }
                const formatted = data.map(m => ({
                    value: m.userId,
                    label: m.displayName
                }));
                set({ managers: formatted });
            }
        } catch (error) {
            console.error('Error fetching managers:', error);
            set({ managers: [] });
        } finally {
            set({ loadingManagers: false });
        }
    },
    
    setManagers: (data) => set({ managers: data }),
}));

export default useManagerStore;
