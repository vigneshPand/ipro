import { create } from 'zustand';
import { Alert } from 'react-native';
import apiClient from '../api/client';

// Color mapping for each leave type to maintain consistent UI
const LEAVE_TYPE_COLOR_MAP = {
    'Casual Leave': '#8a2be2',
    'Sick Leave': '#00ced1',
    'Earned Leave': '#6fa8dc',
    'Loss Of Pay': '#32cd32',
    'Bereavement Leave': '#000000',
    'Permission': '#4682b4',
    'Comp-Off Leave': '#ff8c00',
    'Work From Home': '#20b2aa',
};

const mapLeaveBalanceToUI = (item) => ({
    id: item.id?.toString() || String(Math.random()),
    title: item.type,
    titleColor: LEAVE_TYPE_COLOR_MAP[item.type] || '#3E699B',
    total: item.total?.toString() ?? '0',
    requested: item.requested?.toString() ?? '0',
    used: item.used?.toString() ?? '0',
    balance: item.remaining?.toString() ?? '0',
});

const useLeaveStore = create((set, get) => ({
    // State
    leaveBalances: [],
    loading: false,
    error: null,

    pendingLeaves: [],
    loadingPending: false,
    pendingPageNo: 0,
    pendingTotalPages: 0,

    selectedLeaveDetails: null,
    loadingLeaveDetails: false,

    historyLeaves: [],
    historyLoading: false,
    historyPageNo: 0,
    historyTotalPages: 0,

    // Actions
    fetchLeaveBalances: async (userId, year) => {
        set({ loading: true, error: null });
        try {
            const response = await apiClient.get('/leave/userLeaveBalance', {
                params: { userId, year },
            });

            const data = response.data;

            const mapped = Array.isArray(data)
                ? data.map(mapLeaveBalanceToUI)
                : [];

            set({ leaveBalances: mapped, loading: false });
        } catch (error) {
            console.error('fetchLeaveBalances Error:', error);
            set({
                error: error?.response?.data?.message || error.message || 'Failed to fetch leave balances',
                loading: false,
            });
        }
    },

    fetchPendingLeaves: async (userId, year, pageNo = 0, extraParams = {}) => {
        set({ loadingPending: true });
        try {
            const params = {
                userId,
                year,
                pageNo,
                sortBy: 'startDate',
                direction: 'asc',
                keyword: '',
                ...extraParams,
            };
            const response = await apiClient.get('/leave/userPendingTable', {
                params,
            });
            const data = response.data;
            const content = data?.content || [];
            set({
                pendingLeaves: pageNo === 0 ? content : [...get().pendingLeaves, ...content],
                pendingPageNo: pageNo,
                pendingTotalPages: data?.totalPages || 0,
                loadingPending: false
            });
        } catch (error) {
            set({ loadingPending: false });
            console.error('fetchPendingLeaves Error:', error);
        }
    },

    fetchHistoryLeaves: async (userId, year, fromDate, toDate, pageNo = 0, extraParams = {}) => {
        set({ historyLoading: true });
        try {
            const params = {
                userId,
                year,
                pageNo,
                pageSize: 10,
                sortBy: 'start_date',
                direction: 'desc',
                fromDate,
                toDate,
                keyword: '',
                ...extraParams,
            };
            const response = await apiClient.get('/leave/userHistoryTable', {
                params,
            });
            const data = response.data;
            const content = data?.content || [];
            set({
                historyLeaves: pageNo === 0 ? content : [...get().historyLeaves, ...content],
                historyPageNo: pageNo,
                historyTotalPages: data?.totalPages || 0,
                historyLoading: false
            });
        } catch (error) {
            set({ historyLoading: false });
            console.error('fetchHistoryLeaves Error:', error);
        }
    },

    fetchLeaveDetails: async (requestId, startDate, endDate) => {
        set({ loadingLeaveDetails: true, selectedLeaveDetails: null });
        try {
            const response = await apiClient.get('/leave/leaveRequestById', {
                params: {
                    requestId,
                    startDate,
                    endDate
                }
            });
            set({
                selectedLeaveDetails: response.data,
                loadingLeaveDetails: false
            });
        } catch (error) {
            set({ loadingLeaveDetails: false });
            Alert.alert('Error', error?.response?.data?.message || 'Failed to fetch leave details');
        }
    },

    withdrawLeave: async (requestId, leaveId, session, comments) => {
        try {
            const params = {
                requestId,
                leaveId,
                session,
                withDrawType: "all",
                comments: comments || ""
            };
            const response = await apiClient.put("/leave/withdraw", {}, { params });
            return { success: true, message: response.data?.message || 'Leave request withdrawn successfully' };
        } catch (error) {
            return {
                success: false,
                message: error?.response?.data?.message || error.message || 'Error withdrawing leave'
            };
        }
    },

    // Used by AttendanceDetailModal — no requestId, fixed session & withDrawType
    withdrawLeaveFromAttendance: async (leaveId, comments) => {
        try {
            const params = {
                leaveId,
                session: "full day",
                withDrawType: "single",
                comments: comments || ""
            };
            const response = await apiClient.put("/leave/withdraw", {}, { params });
            return { success: true, message: response.data?.message || 'Withdrawn successfully' };
        } catch (error) {
            return {
                success: false,
                message: error?.response?.data?.message || error.message || 'Error withdrawing request'
            };
        }
    },

    fetchNextPendingPage: async (userId, year, extraParams = {}) => {
        const { pendingPageNo, pendingTotalPages, loadingPending } = get();
        if (loadingPending || pendingPageNo + 1 >= pendingTotalPages) return;
        await get().fetchPendingLeaves(userId, year, pendingPageNo + 1, extraParams);
    },

    fetchNextHistoryPage: async (userId, year, fromDate, toDate, extraParams = {}) => {
        const { historyPageNo, historyTotalPages, historyLoading } = get();
        if (historyLoading || historyPageNo + 1 >= historyTotalPages) return;
        await get().fetchHistoryLeaves(userId, year, fromDate, toDate, historyPageNo + 1, extraParams);
    },
}));

export default useLeaveStore;
