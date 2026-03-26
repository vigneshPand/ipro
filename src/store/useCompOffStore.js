import { create } from 'zustand';
import apiClient from '../api/client';

const useCompOffStore = create((set, get) => ({
    // State
    pendingList: [],
    historyList: [],
    selectedDetails: null,
    loadingLeaveDetails: false,
    pendingLoading: false,
    historyLoading: false,
    refreshing: false,
    pendingPageNo: 0,
    pendingTotalPages: 0,
    historyPageNo: 0,
    historyTotalPages: 0,

    // Overview state
    overview: null,
    overviewLoading: false,

    // Actions
    fetchPendingCompOff: async (year = new Date().getFullYear(), pageNo = 0, extraParams = {}) => {
        set({ pendingLoading: true });
        try {
            const response = await apiClient.get('/comp-off-grant/pending-requests', {
                params: {
                    page: pageNo,
                    size: 10,
                    sortBy: 'startDate',
                    sortDir: 'asc',
                    year,
                    ...extraParams,
                },
            });
            const data = response.data;
            const content = data?.content || data || [];
            set({
                pendingList: pageNo === 0 ? content : [...get().pendingList, ...content],
                pendingPageNo: pageNo,
                pendingTotalPages: data?.totalPages || 0,
                pendingLoading: false
            });
        } catch (error) {
            console.error('fetchPendingCompOff error:', error);
            set({ pendingLoading: false });
        }
    },

    fetchHistoryCompOff: async (year = new Date().getFullYear(), startDate, endDate, pageNo = 0, extraParams = {}) => {
        set({ historyLoading: true });
        try {
            const response = await apiClient.get('/comp-off-grant/history', {
                params: {
                    page: pageNo,
                    size: 10,
                    sortBy: 'start_date',
                    sortDir: 'desc',
                    year,
                    startDate,
                    endDate,
                    ...extraParams,
                },
            });
            const data = response.data;
            const content = data?.content || data || [];
            set({
                historyList: pageNo === 0 ? content : [...get().historyList, ...content],
                historyPageNo: pageNo,
                historyTotalPages: data?.totalPages || 0,
                historyLoading: false
            });
        } catch (error) {
            console.error('fetchHistoryCompOff error:', error);
            set({ historyLoading: false });
        }
    },

    fetchCompOffDetails: async (id, userId) => {
        set({ loadingLeaveDetails: true });
        try {
            const response = await apiClient.get(`/comp-off-grant/details?id=${id}&userId=${userId}`);
            set({ selectedDetails: response.data || null });
        } catch (error) {
            console.error('fetchCompOffDetails error:', error);
            set({ selectedDetails: null });
        } finally {
            set({ loadingLeaveDetails: false });
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
            set({ pendingList: response.data?.content || response.data || [] });
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

    fetchNextPendingPage: async (year = new Date().getFullYear(), extraParams = {}) => {
        const { pendingPageNo, pendingTotalPages, pendingLoading } = get();
        if (pendingLoading || pendingPageNo + 1 >= pendingTotalPages) return;
        await get().fetchPendingCompOff(year, pendingPageNo + 1, extraParams);
    },

    fetchNextHistoryPage: async (year = new Date().getFullYear(), startDate, endDate, extraParams = {}) => {
        const { historyPageNo, historyTotalPages, historyLoading } = get();
        if (historyLoading || historyPageNo + 1 >= historyTotalPages) return;
        await get().fetchHistoryCompOff(year, startDate, endDate, historyPageNo + 1, extraParams);
    },
}));

export default useCompOffStore;
