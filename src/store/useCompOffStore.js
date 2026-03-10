import { create } from 'zustand';
import apiClient from '../api/client';

const useCompOffStore = create((set, get) => ({
    // State
    pendingList: [],
    historyList: [],
    selectedDetails: null,
    loading: false,
    refreshing: false,

    // Actions
    fetchPendingCompOff: async (year = new Date().getFullYear()) => {
        set({ loading: true });
        try {
            const response = await apiClient.get(`/comp-off-grant/pending-requests?page=0&sortBy=startDate&sortDir=asc&year=${year}`);
            set({ pendingList: response.data || [] });
        } catch (error) {
            console.error('fetchPendingCompOff error:', error);
            set({ pendingList: [] });
        } finally {
            set({ loading: false });
        }
    },

    fetchHistoryCompOff: async (year = new Date().getFullYear(), startDate, endDate) => {
        set({ loading: true });
        try {
            const url = `/comp-off-grant/history?page=0&size=10&sortBy=start_date&year=${year}&sortDir=desc&startDate=${startDate}&endDate=${endDate}`;
            const response = await apiClient.get(url);
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

    refreshPending: async (year = new Date().getFullYear()) => {
        set({ refreshing: true });
        try {
            const response = await apiClient.get(`/comp-off-grant/pending-requests?page=0&sortBy=startDate&sortDir=asc&year=${year}`);
            set({ pendingList: response.data || [] });
        } catch (error) {
            console.error('refreshPending error:', error);
        } finally {
            set({ refreshing: false });
        }
    },

    refreshHistory: async (year = new Date().getFullYear(), startDate, endDate) => {
        set({ refreshing: true });
        try {
            const url = `/comp-off-grant/history?page=0&size=10&sortBy=start_date&year=${year}&sortDir=desc&startDate=${startDate}&endDate=${endDate}`;
            const response = await apiClient.get(url);
            set({ historyList: response.data?.content || response.data || [] });
        } catch (error) {
            console.error('refreshHistory error:', error);
        } finally {
            set({ refreshing: false });
        }
    },
}));

export default useCompOffStore;
