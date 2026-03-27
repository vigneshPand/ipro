import { create } from 'zustand';
import { Alert } from 'react-native';
import LeaveService from '../services/LeaveService';
import apiClient from '../api/client';

// Helper: Merge records while preventing duplicates by id
const mergeUnique = (oldList, newList) => {
    const map = new Map();
    [...oldList, ...newList].forEach(item => {
        map.set(item.id, item);
    });
    return Array.from(map.values());
};

const useTeamLeaveStore = create((set, get) => ({
    // Pending State
    pendingList: [],
    loadingPending: false,
    pendingPageNo: 0,
    pendingTotalPages: 0,

    // History State
    historyList: [],
    loadingHistory: false,
    historyPageNo: 0,
    historyTotalPages: 0,

    // Detail Modal State
    selectedLeaveDetails: null,
    loadingLeaveDetails: false,

    // ─── Pending API ───
    fetchPendingLeaves: async (mail, year, pageNo = 0, extraParams = {}) => {
        set({ loadingPending: true });
        try {
            const params = {
                mail,
                year,
                pageNo,
                sortBy: 'startDate',
                direction: 'desc',
                keyword: '',
                ...extraParams,
            };
            const data = await LeaveService.getManagerPendingLeaves(params);
            const content = data?.content || [];
            set({
                pendingList: pageNo === 0 ? content : mergeUnique(get().pendingList, content),
                pendingPageNo: pageNo,
                pendingTotalPages: data?.totalPages || 0,
                loadingPending: false,
            });
        } catch (error) {
            set({ loadingPending: false });
            console.error('fetchTeamPendingLeaves Error:', error);
        }
    },

    fetchNextPendingPage: async (mail, year, extraParams = {}) => {
        const { pendingPageNo, pendingTotalPages, loadingPending } = get();
        if (loadingPending || pendingPageNo + 1 >= pendingTotalPages) return;
        await get().fetchPendingLeaves(mail, year, pendingPageNo + 1, extraParams);
    },

    // ─── History API ───
    fetchHistoryLeaves: async (mail, year, fromDate, toDate, pageNo = 0, extraParams = {}) => {
        set({ loadingHistory: true });
        try {
            const params = {
                mail,
                year,
                pageNo,
                pageSize: 10,
                sortBy: 'startDate',
                direction: 'desc',
                fromDate,
                toDate,
                keyword: '',
                ...extraParams,
            };
            const data = await LeaveService.getManagerHistoryLeaves(params);
            const content = data?.content || [];
            set({
                historyList: pageNo === 0 ? content : mergeUnique(get().historyList, content),
                historyPageNo: pageNo,
                historyTotalPages: data?.totalPages || 0,
                loadingHistory: false,
            });
        } catch (error) {
            set({ loadingHistory: false });
            console.error('fetchTeamHistoryLeaves Error:', error);
        }
    },

    fetchNextHistoryPage: async (mail, year, fromDate, toDate, extraParams = {}) => {
        const { historyPageNo, historyTotalPages, loadingHistory } = get();
        if (loadingHistory || historyPageNo + 1 >= historyTotalPages) return;
        await get().fetchHistoryLeaves(mail, year, fromDate, toDate, historyPageNo + 1, extraParams);
    },

    // ─── Leave Detail Modal API ───
    fetchLeaveDetails: async (requestId, startDate, endDate, multiApprovalNumber) => {
        set({ loadingLeaveDetails: true, selectedLeaveDetails: null });
        try {
            const params = { requestId, startDate, endDate };
            if (multiApprovalNumber !== undefined && multiApprovalNumber !== null) {
                params.multiApprovalNumber = multiApprovalNumber;
            }
            const response = await apiClient.get('/leave/leaveRequestById', { params });
            set({
                selectedLeaveDetails: response.data,
                loadingLeaveDetails: false,
            });
        } catch (error) {
            set({ loadingLeaveDetails: false });
            Alert.alert('Error', error?.response?.data?.message || 'Failed to fetch leave details');
        }
    },

    // ─── Reset ───
    resetPending: () => set({ pendingList: [], pendingPageNo: 0, pendingTotalPages: 0 }),
    resetHistory: () => set({ historyList: [], historyPageNo: 0, historyTotalPages: 0 }),
}));

export default useTeamLeaveStore;
