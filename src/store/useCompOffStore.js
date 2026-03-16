import { create } from 'zustand';
import apiClient from '../api/client';

const useCompOffStore = create((set, get) => ({
    // State
    pendingList: [],
    historyList: [],
    selectedDetails: null,
    loading: false,
    refreshing: false,

    // Overview state
    overview: null,
    overviewLoading: false,

    // Actions
    fetchPendingCompOff: async (year = new Date().getFullYear(), extraParams = {}) => {
        set({ loading: true });
        try {
            const response = await apiClient.get('/comp-off-grant/pending-requests', {
                params: {
                    page: 0,
                    sortBy: 'startDate',
                    sortDir: 'asc',
                    year,
                    ...extraParams,
                },
            });
            set({ pendingList: response.data || [] });
        } catch (error) {
            console.error('fetchPendingCompOff error:', error);
            set({ pendingList: [] });
        } finally {
            set({ loading: false });
        }
    },

    fetchHistoryCompOff: async (year = new Date().getFullYear(), startDate, endDate, extraParams = {}) => {
        set({ loading: true });
        try {
            const response = await apiClient.get('/comp-off-grant/history', {
                params: {
                    page: 0,
                    size: 10,
                    sortBy: 'start_date',
                    sortDir: 'desc',
                    year,
                    startDate,
                    endDate,
                    ...extraParams,
                },
            });
            set({ historyList: response.data?.content || response.data || [] });
        } catch (error) {
            console.error('fetchHistoryCompOff error:', error);
            set({ historyList: [] });
        } finally {
            set({ loading: false });
        }
    },

    fetchCompOffDetails: async (id, userId) => {
        set({ loading: true });
        try {
            const response = await apiClient.get(`/comp-off-grant/details?id=${id}&userId=${userId}`);
            set({ selectedDetails: response.data || null });
        } catch (error) {
            console.error('fetchCompOffDetails error:', error);
            set({ selectedDetails: null });
        } finally {
            set({ loading: false });
        }
    },

    refreshPending: async (year = new Date().getFullYear(), extraParams = {}) => {
        set({ refreshing: true });
        try {
            const response = await apiClient.get('/comp-off-grant/pending-requests', {
                params: {
                    page: 0,
                    sortBy: 'startDate',
                    sortDir: 'asc',
                    year,
                    ...extraParams,
                },
            });
            set({ pendingList: response.data || [] });
        } catch (error) {
            console.error('refreshPending error:', error);
        } finally {
            set({ refreshing: false });
        }
    },

    refreshHistory: async (year = new Date().getFullYear(), startDate, endDate, extraParams = {}) => {
        set({ refreshing: true });
        try {
            const response = await apiClient.get('/comp-off-grant/history', {
                params: {
                    page: 0,
                    size: 10,
                    sortBy: 'start_date',
                    sortDir: 'desc',
                    year,
                    startDate,
                    endDate,
                    ...extraParams,
                },
            });
            set({ historyList: response.data?.content || response.data || [] });
        } catch (error) {
            console.error('refreshHistory error:', error);
        } finally {
            set({ refreshing: false });
        }
    },

    // Comp-Off Grant Overview
    fetchCompOffOverview: async () => {
        set({ overviewLoading: true });
        try {
            const response = await apiClient.get('/comp-off-grant/overview');
            set({ overview: response.data || null, overviewLoading: false });
        } catch (error) {
            set({ overviewLoading: false });
        }
    },

    // Apply Comp-Off Grant
    applyCompOffGrant: async (payload) => {
        try {
            const response = await apiClient.post('/comp-off-grant/apply', payload);
            return { success: true, message: response.data?.message || response.data || 'Comp-Off Grant request applied successfully' };
        } catch (error) {
            const msg = error?.response?.data?.message || error?.response?.data || 'Failed to apply comp-off grant';
            return { success: false, message: typeof msg === 'string' ? msg : JSON.stringify(msg) };
        }
    },
}));

export default useCompOffStore;
