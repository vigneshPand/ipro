import { create } from 'zustand';
import apiClient from '../api/client';

const useLeaveRequestStore = create((set) => ({
    isSubmitting: false,
    submitError: null,

    submitLeaveRequest: async (payload) => {
        set({ isSubmitting: true, submitError: null });

        try {
            // extract file data (large)
            const { fileData, ...rest } = payload;

            const response = await apiClient.post(
                '/leave/leaveRequest',
                {
                    fileData,
                },
                {
                    params: {
                        ...rest,
                        leaveDates: JSON.stringify(rest.leaveDates),
                    },
                    maxBodyLength: Infinity,
                    maxContentLength: Infinity,
                }
            );

            set({ isSubmitting: false })
            return response;

        } catch (error) {
            const message =
                error?.response?.data?.message ||
                'Leave request failed';

            set({ isSubmitting: false, submitError: message });
            throw error;
        }
    },

    clearError: () => set({ submitError: null }),
}));

export default useLeaveRequestStore;