import { create } from 'zustand';
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

const useLeaveStore = create((set) => ({
    // State
    leaveBalances: [],
    loading: false,
    error: null,

    pendingLeaves: [],
    loadingPending: false,

    selectedLeaveDetails: null,
    loadingLeaveDetails: false,

    historyLeaves: [],
    historyLoading: false,

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

    fetchPendingLeaves: async (userId, year) => {
        set({ loadingPending: true });
        try {
            const response = await apiClient.get('/leave/userPendingTable', {
                params: {
                    userId,
                    year,
                    pageNo: 0,
                    sortBy: 'startDate',
                    direction: 'asc',
                    keyword: ''
                }
            });
            set({
                pendingLeaves: response.data?.content || [],
                loadingPending: false
            });
        } catch (error) {
            set({ loadingPending: false });
        }
    },

    fetchHistoryLeaves: async (userId, year, fromDate, toDate) => {
        set({ historyLoading: true });
        try {
            const response = await apiClient.get('/leave/userHistoryTable', {
                params: {
                    userId,
                    year,
                    pageNo: 0,
                    sortBy: 'start_date',
                    direction: 'desc',
                    fromDate,
                    toDate,
                    keyword: ''
                }
            });
            set({
                historyLeaves: response.data?.content || [],
                historyLoading: false
            });
        } catch (error) {
            set({ historyLoading: false });
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
}));

export default useLeaveStore;
