import { create } from 'zustand';
import apiClient from '../api/client';

const useHolidayStore = create((set) => ({
    holidays: [],
    loading: false,

    fetchHolidays: async (year, userId) => {
        set({ loading: true });
        try {
            const response = await apiClient.get('/holiday/getCurrentHolidays', {
                params: { year, userId }
            });
            set({ holidays: response.data || [], loading: false });
        } catch (error) {
            console.error('Fetch Holidays Error:', error);
            set({ loading: false });
        }
    }
}));

export default useHolidayStore;
