import { create } from 'zustand';
import AttendanceService from '../services/AttendanceService';

/**
 * Returns the last day of a given month.
 * @param {number} year
 * @param {number} month - 0-indexed (0 = Jan)
 */
const getLastDayOfMonth = (year, month) => new Date(year, month + 1, 0).getDate();

/**
 * Pad a number to two digits.
 */
const pad = (n) => String(n).padStart(2, '0');

const now = new Date();

const useAttendanceGridStore = create((set, get) => ({
    // ---------- State ----------
    selectedYear: now.getFullYear(),
    selectedMonth: now.getMonth(), // 0-indexed
    fromDate: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`,
    toDate: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${getLastDayOfMonth(now.getFullYear(), now.getMonth())}`,
    attendanceData: [],
    loading: false,
    error: null,

    // ---------- Actions ----------

    /**
     * Navigate to a specific month/year and recalculate date range.
     */
    setMonth: (year, month) => {
        const lastDay = getLastDayOfMonth(year, month);
        set({
            selectedYear: year,
            selectedMonth: month,
            fromDate: `${year}-${pad(month + 1)}-01`,
            toDate: `${year}-${pad(month + 1)}-${lastDay}`,
        });
    },

    /**
     * Go to next month.
     */
    goNextMonth: () => {
        const { selectedYear, selectedMonth } = get();
        const nextMonth = selectedMonth === 11 ? 0 : selectedMonth + 1;
        const nextYear = selectedMonth === 11 ? selectedYear + 1 : selectedYear;
        get().setMonth(nextYear, nextMonth);
    },

    /**
     * Go to previous month.
     */
    goPrevMonth: () => {
        const { selectedYear, selectedMonth } = get();
        const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
        const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
        get().setMonth(prevYear, prevMonth);
    },

    /**
     * Fetch calendar attendance data from the API.
     * @param {number|string} userId
     */
    fetchCalendarStatus: async (userId) => {
        const { fromDate, toDate } = get();
        set({ loading: true, error: null });
        try {
            const response = await AttendanceService.getCalenderStatus(userId, fromDate, toDate);
            set({
                attendanceData: response.data || [],
                loading: false,
            });
        } catch (err) {
            console.error('fetchCalendarStatus Error:', err);
            set({
                loading: false,
                error: 'Failed to fetch attendance data.',
                attendanceData: [],
            });
        }
    },

    /**
     * Reset the store to defaults.
     */
    resetStore: () => {
        const today = new Date();
        set({
            selectedYear: today.getFullYear(),
            selectedMonth: today.getMonth(),
            fromDate: `${today.getFullYear()}-${pad(today.getMonth() + 1)}-01`,
            toDate: `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${getLastDayOfMonth(today.getFullYear(), today.getMonth())}`,
            attendanceData: [],
            loading: false,
            error: null,
        });
    },
}));

export default useAttendanceGridStore;
