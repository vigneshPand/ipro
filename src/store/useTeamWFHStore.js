import { create } from 'zustand';
import apiClient from '../api/client';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const mergeUnique = (oldList, newList, key = 'requestId') => {
    const map = new Map();
    [...oldList, ...newList].forEach(item => map.set(item[key], item));
    return Array.from(map.values());
};

// ─── Store ────────────────────────────────────────────────────────────────────

const useTeamWFHStore = create((set, get) => ({

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

    // ── Manager Dropdown (cached) ─────────────────────────────
    managerDropdown: [],
    loadingManagerDropdown: false,

    // ── Pending List API ─────────────────────────────────────
    /**
     * GET /api/leave/managerOrAdminWfhPendingTable
     * Params: mail, year, sortBy, direction, pageNo, fromDate?, toDate?, keyword?
     */
    fetchPendingList: async (mail, year, pageNo = 0, extraParams = {}) => {
        set({ loadingPending: true });
        try {
            const response = await apiClient.get('/leave/managerOrAdminWfhPendingTable', {
                params: {
                    mail,
                    year,
                    pageNo,
                    sortBy: 'noOfDays',
                    direction: 'desc',
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
            console.error('TeamWFH fetchPendingList Error:', error);
            set({ loadingPending: false });
        }
    },

    fetchNextPendingPage: async (mail, year, extraParams = {}) => {
        const { pendingPageNo, pendingTotalPages, loadingPending } = get();
        if (loadingPending || pendingPageNo + 1 >= pendingTotalPages) return;
        await get().fetchPendingList(mail, year, pendingPageNo + 1, extraParams);
    },

    // ── History List API ─────────────────────────────────────
    /**
     * GET /api/leave/managerOrAdminWfhHistoryTable
     * Params: mail, year, fromDate, toDate, status, pageNo, sortBy, direction, keyword?
     */
    fetchHistoryList: async (mail, year, fromDate, toDate, pageNo = 0, extraParams = {}) => {
        set({ loadingHistory: true });
        try {
            const statusStr = extraParams.status || extraParams.statusId || '';
            const response = await apiClient.get('/leave/managerOrAdminWfhHistoryTable', {
                params: {
                    mail,
                    year,
                    pageNo,
                    fromDate,
                    toDate,
                    sortBy: 'startDate',
                    direction: 'desc',
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
            console.error('TeamWFH fetchHistoryList Error:', error);
            set({ loadingHistory: false });
        }
    },

    fetchNextHistoryPage: async (mail, year, fromDate, toDate, extraParams = {}) => {
        const { historyPageNo, historyTotalPages, loadingHistory } = get();
        if (loadingHistory || historyPageNo + 1 >= historyTotalPages) return;
        await get().fetchHistoryList(mail, year, fromDate, toDate, historyPageNo + 1, extraParams);
    },

    // ── Detail Modal API ─────────────────────────────────────
    /**
     * GET /api/leave/leaveRequestById?requestId=<requestId>&startDate=<startDate>&endDate=<endDate>
     */
    fetchDetails: async (requestId, startDate, endDate) => {
        set({ loadingDetails: true, detailsData: null });
        try {
            const response = await apiClient.get('/leave/leaveRequestById', {
                params: { requestId, startDate, endDate },
            });
            set({ detailsData: response.data || null, loadingDetails: false });
        } catch (error) {
            console.error('TeamWFH fetchDetails Error:', error);
            set({ loadingDetails: false, detailsData: null });
        }
    },

    // ── Manager Dropdown API ─────────────────────────────────
    fetchManagerDropdown: async (requestingUserId) => {
        if (get().managerDropdown.length > 0) return;
        set({ loadingManagerDropdown: true });
        try {
            const response = await apiClient.get('/regularizationRecord/getManagersDropDown', {
                params: { requestingUserId, managersOnly: true },
            });
            set({ managerDropdown: Array.isArray(response.data) ? response.data : [], loadingManagerDropdown: false });
        } catch (error) {
            console.error('TeamWFH fetchManagerDropdown Error:', error);
            set({ loadingManagerDropdown: false });
        }
    },

    clearManagerDropdownCache: () => set({ managerDropdown: [] }),

    // ── Approve ──────────────────────────────────────────────
    approveRequest: async (requestId, managerId, remarks) => {
        try {
            const response = await apiClient.put('/leave/approve', null, {
                params: {
                    requestId,
                    managerId,
                    remarks,
                },
            });

            return {
                success: true,
                message:
                    response?.data?.message ||
                    response?.data ||
                    'Approved Successfully',
            };
        } catch (error) {
            return {
                success: false,
                message:
                    error?.response?.data?.message ||
                    error?.message ||
                    'Failed to approve',
            };
        }
    },

    // ── Reject ───────────────────────────────────────────────
    rejectRequest: async (requestId, managerId, remarks = '') => {
        try {
            const response = await apiClient.put('/leave/reject', null, {
                params: { requestId, managerId, remarks },
            });
            return {
                success: true,
                message: response?.data?.message || response?.data || 'Rejected Successfully',
            };
        } catch (error) {
            return {
                success: false,
                message: error?.response?.data?.message || error?.message || 'Failed to reject',
            };
        }
    },

    // ── Transfer ─────────────────────────────────────────────
    transferRequest: async (requestId, managerId) => {
        try {
            const response = await apiClient.put('/leave/transferTo', null, {
                params: { requestId, managerId },
            });
            return {
                success: true,
                message: response?.data?.message || response?.data || 'Transferred Successfully',
            };
        } catch (error) {
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
    }),

    // ── Reset ────────────────────────────────────────────────
    resetPending: () => set({ pendingList: [], pendingPageNo: 0, pendingTotalPages: 0 }),
    resetHistory: () => set({ historyList: [], historyPageNo: 0, historyTotalPages: 0 }),
    resetForTabSwitch: () => set({ selectedItem: null, detailsData: null }),
}));

export default useTeamWFHStore;
