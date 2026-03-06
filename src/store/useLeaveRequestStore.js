import { create } from 'zustand';
import apiClient from '../api/client';

const useLeaveRequestStore = create((set) => ({
    isSubmitting: false,
    submitError: null,

    submitLeaveRequest: async (payload) => {
        set({ isSubmitting: true, submitError: null });
        try {
            const response = await apiClient.post('/leave/leaveRequest', null, {
                params: payload,
            });
            set({ isSubmitting: false });
            return response.data;
        } catch (error) {
            const message = error?.response?.data?.message || 'Leave request failed';
            set({ isSubmitting: false, submitError: message });
            throw error;
        }
    },

    clearError: () => set({ submitError: null }),
}));

export default useLeaveRequestStore;
