import { create } from 'zustand';
import apiClient from '../api/client';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const mergeUnique = (oldList, newList, key = 'requestId') => {
    const map = new Map();
    [...oldList, ...newList].forEach(item => map.set(item[key], item));
    return Array.from(map.values());
};

// ─── Store ────────────────────────────────────────────────────────────────────

const useTeamRegularizationStore = create((set, get) => ({

    // ── Pending ─────────────────────────────────────────────
    pendingList: [],
    loadingPending: false,
    pendingPageNo: 0,
    pendingTotalPages: 0,

    // ── History ─────────────────────────────────────────────
    historyList: [],
    loadingHistory: false,
    historyPageNo: 0,
    historyTotalPages: 0,

    // ── Detail Modal ─────────────────────────────────────────
    selectedItem: null,
    detailsData: null,
    loadingDetails: false,

    // ── Previous Entries ─────────────────────────────────────
    previousEntries: null,
    isPreviousView: false,
    loadingPreviousEntries: false,

    // ── Manager Dropdown (cached) ─────────────────────────────
    managerDropdown: [],
    loadingManagerDropdown: false,

    // ── Pending List API ─────────────────────────────────────
    /**
     * GET /api/regularizationRecord/adminOrManagerPendingView
     * Params: managerUserId, year, sortBy, sortDirection, pageNo, fromDate?, toDate?
     */
    fetchPendingList: async (managerUserId, year, pageNo = 0, extraParams = {}) => {
        set({ loadingPending: true });
        try {
            const response = await apiClient.get('/regularizationRecord/adminOrManagerPendingView', {
                params: {
                    managerUserId,
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
                pendingList: pageNo === 0 ? content : mergeUnique(state.pendingList, content),
                pendingPageNo: pageNo,
                pendingTotalPages: data?.totalPages || 0,
                loadingPending: false,
            }));
        } catch (error) {
            console.error('TeamReg fetchPendingList Error:', error);
            set({ loadingPending: false });
        }
    },

    fetchNextPendingPage: async (managerUserId, year, extraParams = {}) => {
        const { pendingPageNo, pendingTotalPages, loadingPending } = get();
        if (loadingPending || pendingPageNo + 1 >= pendingTotalPages) return;
        await get().fetchPendingList(managerUserId, year, pendingPageNo + 1, extraParams);
    },

    /**
     * GET /api/regularizationRecord/adminOrManagerHistoryView
     * Params: managerUserId, year, fromDate, toDate, status (Approved / Rejected / Pending), pageNo, sortBy, sortDirection
     */
    fetchHistoryList: async (managerUserId, year, fromDate, toDate, pageNo = 0, extraParams = {}) => {
        set({ loadingHistory: true });
        try {
            // Extract status if present in extraParams (some filter components might group it)
            const statusStr = extraParams.status || extraParams.statusId || '';

            const response = await apiClient.get('/regularizationRecord/adminOrManagerHistoryView', {
                params: {
                    managerUserId,
                    year,
                    pageNo,
                    fromDate,
                    toDate,
                    sortBy: 'date',
                    sortDirection: 'desc',
                    status: statusStr,
                    ...extraParams,
                },
            });
            const data = response.data;
            const content = data?.content || [];
            set(state => ({
                historyList: pageNo === 0 ? content : mergeUnique(state.historyList, content),
                historyPageNo: pageNo,
                historyTotalPages: data?.totalPages || 0,
                loadingHistory: false,
            }));
        } catch (error) {
            console.error('TeamReg fetchHistoryList Error:', error);
            set({ loadingHistory: false });
        }
    },

    fetchNextHistoryPage: async (managerUserId, year, fromDate, toDate, extraParams = {}) => {
        const { historyPageNo, historyTotalPages, loadingHistory } = get();
        if (loadingHistory || historyPageNo + 1 >= historyTotalPages) return;
        await get().fetchHistoryList(managerUserId, year, fromDate, toDate, historyPageNo + 1, extraParams);
    },

    // ── Detail Modal API ─────────────────────────────────────
    /**
     * GET /api/regularizationRecord/findByRequestId?id=<requestId>
     */
    fetchDetails: async (requestId) => {
        set({ loadingDetails: true, detailsData: null, previousEntries: null, isPreviousView: false });
        try {
            const response = await apiClient.get('/regularizationRecord/findByRequestId', {
                params: { id: requestId },
            });
            set({ detailsData: response.data || null, loadingDetails: false });
        } catch (error) {
            console.error('TeamReg fetchDetails Error:', error);
            set({ loadingDetails: false, detailsData: null });
        }
    },

    // Refresh (used when toggling back from previous entries)
    refreshDetails: async (requestId) => {
        set({ loadingDetails: true, isPreviousView: false, previousEntries: null });
        try {
            const response = await apiClient.get('/regularizationRecord/findByRequestId', {
                params: { id: requestId },
            });
            set({ detailsData: response.data || null, loadingDetails: false });
        } catch (error) {
            console.error('TeamReg refreshDetails Error:', error);
            set({ loadingDetails: false });
        }
    },

    // ── Previous Entries API ─────────────────────────────────
    /**
     * GET /api/regularizationRecord/previousTimings?statusId=<requestId>
     */
    fetchPreviousEntries: async (requestId) => {
        set({ loadingPreviousEntries: true });
        try {
            const response = await apiClient.get('/regularizationRecord/previousTimings', {
                params: { statusId: requestId },
            });
            const entries = Array.isArray(response.data) ? response.data : [];
            set({ previousEntries: entries, isPreviousView: true, loadingPreviousEntries: false });
        } catch (error) {
            console.error('TeamReg fetchPreviousEntries Error:', error);
            set({ previousEntries: [], isPreviousView: true, loadingPreviousEntries: false });
        }
    },

    // ── Manager Dropdown API ─────────────────────────────────
    /**
     * GET /api/regularizationRecord/getManagersDropDown
     * Params: requestingUserId, managersOnly=true
     * Cached in store to avoid redundant calls.
     */
    fetchManagerDropdown: async (requestingUserId) => {
        // Return cached list if already loaded
        if (get().managerDropdown.length > 0) return;
        set({ loadingManagerDropdown: true });
        try {
            const response = await apiClient.get('/regularizationRecord/getManagersDropDown', {
                params: { requestingUserId, managersOnly: true },
            });
            set({ managerDropdown: Array.isArray(response.data) ? response.data : [], loadingManagerDropdown: false });
        } catch (error) {
            console.error('TeamReg fetchManagerDropdown Error:', error);
            set({ loadingManagerDropdown: false });
        }
    },

    clearManagerDropdownCache: () => set({ managerDropdown: [] }),

    // ── Approve ──────────────────────────────────────────────
    /**
     * PUT /api/regularizationRecord/approve
     * Payload: { approvedByUser, remarks, statusId }
     */
    approveRequest: async (statusId, approvedByUser, remarks = '') => {
        try {
            const response = await apiClient.put('/regularizationRecord/approve', {
                approvedByUser,
                remarks,
                statusId,
            });
            return {
                success: true,
                message: response?.data?.message || response?.data || 'Approved Successfully',
            };
        } catch (error) {
            console.error('TeamReg approveRequest Error:', error);
            return {
                success: false,
                message: error?.response?.data?.message || error?.message || 'Failed to approve',
            };
        }
    },

    // ── Reject ───────────────────────────────────────────────
    /**
     * PUT /api/regularizationRecord/reject
     * Payload: { rejectedByUser, remarks, statusId }
     */
    rejectRequest: async (statusId, rejectedByUser, remarks = '') => {
        try {
            const response = await apiClient.put('/regularizationRecord/reject', {
                rejectedByUser,
                remarks,
                statusId,
            });
            return {
                success: true,
                message: response?.data?.message || response?.data || 'Rejected Successfully',
            };
        } catch (error) {
            console.error('TeamReg rejectRequest Error:', error);
            return {
                success: false,
                message: error?.response?.data?.message || error?.message || 'Failed to reject',
            };
        }
    },

    // ── Transfer ─────────────────────────────────────────────
    transferRequest: async (requestId, managerId) => {
        try {
            const response = await apiClient.put('/regularizationRecord/transfer', null, {
                params: { requestId, assignToUserId: managerId },
            });
            return {
                success: true,
                message: response?.data?.message || response?.data || 'Transferred Successfully',
            };
        } catch (error) {
            console.error('TeamReg transferRequest Error:', error);
            return {
                success: false,
                message: error?.response?.data?.message || error?.message || 'Failed to transfer',
            };
        }
    },

    // ── Select / Clear ───────────────────────────────────────
    setSelectedItem: (item) => set({ selectedItem: item }),

    clearSelectedDetails: () => set({
        selectedItem: null,
        detailsData: null,
        previousEntries: null,
        isPreviousView: false,
    }),

    // ── Reset ────────────────────────────────────────────────
    resetPending: () => set({ pendingList: [], pendingPageNo: 0, pendingTotalPages: 0 }),
    resetHistory: () => set({ historyList: [], historyPageNo: 0, historyTotalPages: 0 }),
    resetForTabSwitch: () => set({
        selectedItem: null,
        detailsData: null,
        previousEntries: null,
        isPreviousView: false,
    }),

    // ── Refetch after action ──────────────────────────────────
    /**
     * Called after Approve/Reject to reset pending list and refetch
     */
    refetchPendingAfterAction: async (managerUserId, year) => {
        // 1. Reset pending list and state
        set({
            pendingList: [],
            pendingPageNo: 0,
            pendingTotalPages: 0,
            selectedItem: null,
            detailsData: null,
            previousEntries: null,
            isPreviousView: false,
        });
        // 2. Refetch pending list with default params
        await get().fetchPendingList(managerUserId, year, 0, {});
    },
}));

export default useTeamRegularizationStore;
