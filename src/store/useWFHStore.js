import { create } from 'zustand';
import apiClient from '../api/client';

const useWFHStore = create((set, get) => ({
    // Pending
    pendingList: [],
    loadingPending: false,
    pendingPageNo: 0,
    pendingTotalPages: 0,

    // History
    historyList: [],
    loadingHistory: false,
    historyPageNo: 0,
    historyTotalPages: 0,

    fetchPendingWFH: async (userId, year, pageNo = 0, extraParams = {}) => {
        set({ loadingPending: true });
        try {
            const response = await apiClient.get('/leave/userWFHPending', {
                params: {
                    userId,
                    year,
                    pageNo,
                    sortBy: 'startDate',
                    direction: 'asc',
                    keyword: '',
                    ...extraParams,
                },
            });
            const data = response.data;
            const content = data?.content || [];
            set({
                pendingList: pageNo === 0 ? content : [...get().pendingList, ...content],
                pendingPageNo: pageNo,
                pendingTotalPages: data?.totalPages || 0,
                loadingPending: false,
            });
        } catch (error) {
            console.error('fetchPendingWFH Error:', error);
            set({ loadingPending: false });
        }
    },

    fetchWFHHistory: async (userId, year, fromDate, toDate, pageNo = 0, extraParams = {}) => {
        set({ loadingHistory: true });
        try {
            const response = await apiClient.get('/leave/userWFHHistory', {
                params: {
                    userId,
                    year,
                    pageNo,
                    sortBy: 'startDate',
                    direction: 'desc',
                    fromDate,
                    toDate,
                    keyword: '',
                    ...extraParams,
                },
            });
            const data = response.data;
            const content = data?.content || [];
            set({
                historyList: pageNo === 0 ? content : [...get().historyList, ...content],
                historyPageNo: pageNo,
                historyTotalPages: data?.totalPages || 0,
                loadingHistory: false,
            });
        } catch (error) {
            console.error('fetchWFHHistory Error:', error);
            set({ loadingHistory: false });
        }
    },

    fetchNextPendingPage: async (userId, year, extraParams = {}) => {
        const { pendingPageNo, pendingTotalPages, loadingPending } = get();
        if (loadingPending || pendingPageNo + 1 >= pendingTotalPages) return;
        await get().fetchPendingWFH(userId, year, pendingPageNo + 1, extraParams);
    },

    fetchNextHistoryPage: async (userId, year, fromDate, toDate, extraParams = {}) => {
        const { historyPageNo, historyTotalPages, loadingHistory } = get();
        if (loadingHistory || historyPageNo + 1 >= historyTotalPages) return;
        await get().fetchWFHHistory(userId, year, fromDate, toDate, historyPageNo + 1, extraParams);
    },
}));

export default useWFHStore;
