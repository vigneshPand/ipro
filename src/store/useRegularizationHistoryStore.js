import { create } from 'zustand';
import apiClient from '../api/client';

const useRegularizationHistoryStore = create((set, get) => ({
    // ── List State ─────────────────────────────────────────
    pendingList: [],
    historyList: [],
    pendingPageNo: 0,
    pendingTotalPages: 0,
    historyPageNo: 0,
    historyTotalPages: 0,

    // ── Loading State ──────────────────────────────────────
    loadingPending: false,
    loadingHistory: false,
    loadingDetails: false,
    loadingPreviousEntries: false,

    // ── Details State ──────────────────────────────────────
    selectedItem: null,
    detailsData: null,
    previousEntries: null,   // null = not fetched, [] = fetched but empty
    isPreviousView: false,   // true = showing previous entries, false = showing current

    // ── Pending List ───────────────────────────────────────
    fetchPendingList: async (userId, year, pageNo = 0, extraParams = {}) => {
        set({ loadingPending: true });
        try {
            const response = await apiClient.get('/regularizationRecord/employeePendingList', {
                params: {
                    userId,
                    year,
                    pageNo,
                    sortBy: 'date',
                    sortDirection: 'asc',
                    ...extraParams,
                },
            });
            const data = response.data;
            const content = data?.content || [];
            set(state => ({
                pendingList: pageNo === 0 ? content : [...state.pendingList, ...content],
                pendingPageNo: pageNo,
                pendingTotalPages: data?.totalPages || 0,
                loadingPending: false,
            }));
        } catch (error) {
            console.error('fetchPendingList Error:', error);
            set({ loadingPending: false });
        }
    },

    fetchNextPendingPage: async (userId, year, extraParams = {}) => {
        const { pendingPageNo, pendingTotalPages, loadingPending, fetchPendingList } = get();
        if (loadingPending || pendingPageNo + 1 >= pendingTotalPages) return;
        await fetchPendingList(userId, year, pendingPageNo + 1, extraParams);
    },

    // ── History List ───────────────────────────────────────
    fetchHistoryList: async (userId, year, fromDate, toDate, pageNo = 0, extraParams = {}) => {
        set({ loadingHistory: true });
        try {
            const response = await apiClient.get('/regularizationRecord/employeeHistoryList', {
                params: {
                    userId,
                    year,
                    pageNo,
                    fromDate,
                    toDate,
                    sortBy: 'date',
                    sortDirection: 'desc',
                    ...extraParams,
                },
            });
            const data = response.data;
            const content = data?.content || [];
            set(state => ({
                historyList: pageNo === 0 ? content : [...state.historyList, ...content],
                historyPageNo: pageNo,
                historyTotalPages: data?.totalPages || 0,
                loadingHistory: false,
            }));
        } catch (error) {
            console.error('fetchHistoryList Error:', error);
            set({ loadingHistory: false });
        }
    },

    fetchNextHistoryPage: async (userId, year, fromDate, toDate, extraParams = {}) => {
        const { historyPageNo, historyTotalPages, loadingHistory } = get();
        if (loadingHistory || historyPageNo + 1 >= historyTotalPages) return;
        await get().fetchHistoryList(userId, year, fromDate, toDate, historyPageNo + 1, extraParams);
    },

    // ── Details (findByRequestId) ──────────────────────────
    fetchDetails: async (requestId) => {
        set({ loadingDetails: true, detailsData: null, previousEntries: null, isPreviousView: false });
        try {
            const response = await apiClient.get('/regularizationRecord/findByRequestId', {
                params: { id: requestId },
            });
            set({ detailsData: response.data || null, loadingDetails: false });
        } catch (error) {
            console.error('fetchDetails Error:', error);
            set({ loadingDetails: false, detailsData: null });
        }
    },

    // ── Refresh details (used when toggling back to updated entries) ──
    refreshDetails: async (requestId) => {
        set({ loadingDetails: true, isPreviousView: false, previousEntries: null });
        try {
            const response = await apiClient.get('/regularizationRecord/findByRequestId', {
                params: { id: requestId },
            });
            set({ detailsData: response.data || null, loadingDetails: false });
        } catch (error) {
            console.error('refreshDetails Error:', error);
            set({ loadingDetails: false });
        }
    },

    // ── Previous Entries ───────────────────────────────────
    fetchPreviousEntries: async (requestId) => {
        set({ loadingPreviousEntries: true });
        try {
            const response = await apiClient.get('/regularizationRecord/previousTimings', {
                params: { statusId: requestId },
            });
            const data = response.data;
            // data can be an empty array [] or null
            const entries = Array.isArray(data) ? data : [];
            set({ previousEntries: entries, isPreviousView: true, loadingPreviousEntries: false });
        } catch (error) {
            console.error('fetchPreviousEntries Error:', error);
            set({ previousEntries: [], isPreviousView: true, loadingPreviousEntries: false });
        }
    },

    // ── Withdraw ───────────────────────────────────────────
    loadingWithdraw: false,
    setLoadingWithdraw: (status) => set({ loadingWithdraw: status }),

    withdrawRequest: async (requestId) => {
        set({ loadingWithdraw: true });
        try {
            const response = await apiClient.get('/regularizationRecord/withdraw', {
                params: { statusId: requestId },
            });
            set({ loadingWithdraw: false });
            return {
                success: true,
                message: response.data?.message || response.data || 'Regularization Requests Withdrawn Successfully',
            };
        } catch (error) {
            set({ loadingWithdraw: false });
            const msg = error?.response?.data?.message || error?.response?.data || 'Failed to withdraw regularization';
            return { success: false, message: typeof msg === 'string' ? msg : JSON.stringify(msg) };
        }
    },

    // ── Select / Clear ─────────────────────────────────────
    setSelectedItem: (item) => set({ selectedItem: item }),

    clearSelection: () => set({
        selectedItem: null,
        detailsData: null,
        previousEntries: null,
        isPreviousView: false,
    }),

    clearSelectedDetails: () => set({
        selectedItem: null,
        detailsData: null,
        previousEntries: null,
        isPreviousView: false,
    }),

    // ── Reset on tab switch ────────────────────────────────
    resetForTabSwitch: () => set({
        selectedItem: null,
        detailsData: null,
        previousEntries: null,
        isPreviousView: false,
    }),

    resetPending: () => set({
        pendingList: [],
        pendingPageNo: 0,
        pendingTotalPages: 0,
    }),

    resetHistory: () => set({
        historyList: [],
        historyPageNo: 0,
        historyTotalPages: 0,
    }),
}));

export default useRegularizationHistoryStore;
