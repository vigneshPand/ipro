import { create } from 'zustand';
import AttendanceService from '../services/AttendanceService';

/**
 * Creates a fresh empty row object.
 */
const createEmptyRow = () => ({
    id: Date.now() + Math.random(), // unique key for FlatList
    mode: '',
    inTime: '',
    outTime: '',
    remarks: '',
    errors: {},
});

/**
 * Parse a 24-hour time string like "13:49:47" into
 * { hour: '01', minute: '49', period: 'PM' }
 * Returns null if the string is invalid.
 */
const parseTimeString = (timeStr) => {
    if (!timeStr || timeStr === '-' || timeStr === '') return null;
    try {
        const parts = timeStr.split(':');
        if (parts.length < 2) return null;
        let h = parseInt(parts[0], 10);
        const m = String(parts[1]).padStart(2, '0');
        const period = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return { hour: String(h).padStart(2, '0'), minute: m, period };
    } catch {
        return null;
    }
};

/**
 * Format a parsed time object back to a display string.
 */
export const formatDisplayTime = (hour, minute, period) => {
    if (!hour || !minute || !period) return '';
    return `${hour}:${minute} ${period}`;
};

/**
 * Map a single API object to a row object.
 */
const apiObjToRow = (obj) => {
    const parsed = parseTimeString(obj.timeIn);
    const parsedOut = parseTimeString(obj.timeOut);

    let mode = '';
    const rawMode = (obj.workModeIn || '').toLowerCase();
    if (rawMode === 'home') mode = 'Home';
    else if (rawMode === 'office') mode = 'Office';
    else if (rawMode === 'client') mode = 'Client';

    return {
        id: Date.now() + Math.random(),
        mode,
        inTime: parsed ? formatDisplayTime(parsed.hour, parsed.minute, parsed.period) : '',
        outTime: parsedOut ? formatDisplayTime(parsedOut.hour, parsedOut.minute, parsedOut.period) : '',
        remarks: obj.remarksIn || '',
        errors: {},
    };
};

const useRegularizationStore = create((set, get) => ({
    // ── State ──────────────────────────────────────────────
    editModalVisible: false,
    loading: false,
    fetchError: null,
    rows: [createEmptyRow()],
    warningMessage: null, // shift-timing warning from API
    submitting: false,
    submitMessage: null,   // success or error message string
    submitSuccess: false,  // true = success, false = error

    // ── Open / Close ───────────────────────────────────────
    openEditModal: () => set({ editModalVisible: true }),
    closeEditModal: () => set({ editModalVisible: false }),

    // ── Fetch & prefill ───────────────────────────────────
    fetchAndPrefill: async (date, userId) => {
        set({ loading: true, fetchError: null, rows: [createEmptyRow()] });
        try {
            const response = await AttendanceService.getRegularizationDataEdit(date, userId);
            const data = response?.data;

            let rows;
            if (!data || (Array.isArray(data) && data.length === 0)) {
                // CASE 1 — empty
                rows = [createEmptyRow()];
            } else if (Array.isArray(data)) {
                // CASE 3 — multiple
                rows = data.map(apiObjToRow);
            } else if (typeof data === 'object') {
                // CASE 2 — single object
                rows = [apiObjToRow(data)];
            } else {
                rows = [createEmptyRow()];
            }

            set({ rows, loading: false });
        } catch (err) {
            console.error('fetchAndPrefill error:', err);
            set({ loading: false, fetchError: 'Failed to load data. Please try again.', rows: [createEmptyRow()] });
        }
    },

    // ── Row field updates ─────────────────────────────────
    updateRow: (id, field, value) =>
        set((state) => ({
            rows: state.rows.map((r) =>
                r.id === id
                    ? { ...r, [field]: value, errors: { ...r.errors, [field]: undefined } }
                    : r,
            ),
        })),

    // ── Validate a single row; returns true if valid ──────
    validateRow: (id) => {
        const state = get();
        const row = state.rows.find((r) => r.id === id);
        if (!row) return false;

        const errors = {};
        if (!row.mode) errors.mode = 'Select Mode';
        if (!row.inTime) errors.inTime = 'Select In Time';
        if (!row.outTime) errors.outTime = 'Select Out Time';
        if (!row.remarks.trim()) errors.remarks = 'Remarks required';

        set((s) => ({
            rows: s.rows.map((r) => (r.id === id ? { ...r, errors } : r)),
        }));

        return Object.keys(errors).length === 0;
    },

    // ── Validate ALL rows; returns true if all valid ──────
    validateAllRows: () => {
        const { rows, validateRow } = get();
        let allValid = true;
        for (const row of rows) {
            const valid = validateRow(row.id);
            if (!valid) allValid = false;
        }
        return allValid;
    },

    // ── Add row (validates last row first) ────────────────
    addRow: () => {
        const { rows, validateRow } = get();
        const lastRow = rows[rows.length - 1];
        const valid = validateRow(lastRow.id);
        if (!valid) return false;

        set((state) => ({ rows: [...state.rows, createEmptyRow()] }));
        return true;
    },

    // ── Delete row ─────────────────────────────────────────
    deleteRow: (id) =>
        set((state) => ({
            rows: state.rows.length > 1
                ? state.rows.filter((r) => r.id !== id)
                : state.rows, // never delete the last row
        })),

    // ── Shift timing warning ──────────────────────────────
    /**
     * Build and POST the lessShiftTimingWarning payload from current rows.
     * Only rows with BOTH inTime and outTime are included.
     * Payload order per row: [inTime (currStatus:true), outTime (currStatus:false)]
     */
    checkShiftTimingWarning: async (date, userId) => {
        const { rows } = get();

        // Helper: convert display string "HH:mm AM/PM" → "HH:mm:00" (24h)
        const toServerTime = (display) => {
            if (!display) return null;
            const [timePart, ampm] = display.split(' ');
            if (!timePart || !ampm) return null;
            let [h, m] = timePart.split(':').map(Number);
            if (ampm === 'PM' && h < 12) h += 12;
            if (ampm === 'AM' && h === 12) h = 0;
            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
        };

        // Build payload – skip any row missing inTime OR outTime
        const payload = [];
        for (const row of rows) {
            const inServer = toServerTime(row.inTime);
            const outServer = toServerTime(row.outTime);
            if (!inServer || !outServer) continue;

            const workMode = row.mode || null;
            payload.push({
                date,
                time: inServer,
                currStatus: true,
                location: 'chennai',
                workMode,
                userId,
                remarks: '',
            });
            payload.push({
                date,
                time: outServer,
                currStatus: false,
                location: 'chennai',
                workMode,
                userId,
                remarks: '',
            });
        }

        if (payload.length === 0) {
            set({ warningMessage: null });
            return;
        }

        try {
            const response = await AttendanceService.lessShiftTimingWarning(payload);
            // Backend returns a plain string message or null/empty when no issue
            const msg = typeof response?.data === 'string' && response.data.trim()
                ? response.data.trim()
                : null;
            set({ warningMessage: msg });
        } catch (err) {
            console.error('lessShiftTimingWarning error:', err);
            set({ warningMessage: null });
        }
    },

    // ── Submit Regularization ─────────────────────────────
    /**
     * Validates all rows → builds payload → calls PUT API.
     * Returns { success: boolean } so the UI can react.
     */
    submitRegularization: async (date, userId) => {
        const { validateAllRows, rows } = get();

        // 1. Validate
        if (!validateAllRows()) {
            return { success: false };
        }

        // 2. Build payload (same structure as lessShiftTimingWarning)
        const toServerTime = (display) => {
            if (!display) return null;
            const [timePart, ampm] = display.split(' ');
            if (!timePart || !ampm) return null;
            let [h, m] = timePart.split(':').map(Number);
            if (ampm === 'PM' && h < 12) h += 12;
            if (ampm === 'AM' && h === 12) h = 0;
            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
        };

        const payload = [];
        for (const row of rows) {
            const inServer = toServerTime(row.inTime);
            const outServer = toServerTime(row.outTime);
            if (!inServer || !outServer) continue;

            const workMode = row.mode || null;
            payload.push({
                date,
                time: inServer,
                currStatus: true,
                location: 'chennai',
                workMode,
                userId,
                remarks: row.remarks || '',
            });
            payload.push({
                date,
                time: outServer,
                currStatus: false,
                location: 'chennai',
                workMode,
                userId,
                remarks: '',
            });
        }

        if (payload.length === 0) {
            set({ submitMessage: 'No valid rows to submit.', submitSuccess: false });
            return { success: false };
        }

        // 3. Call API
        set({ submitting: true, submitMessage: null, submitSuccess: false });
        try {
            const response = await AttendanceService.addInRegularization(date, payload);
            const msg = typeof response?.data === 'string' && response.data.trim()
                ? response.data.trim()
                : 'Successfully Regularized';
            set({ submitting: false, submitMessage: msg, submitSuccess: true });
            return { success: true };
        } catch (err) {
            console.error('submitRegularization error:', err);
            const errMsg = typeof err?.response?.data === 'string' && err.response.data.trim()
                ? err.response.data.trim()
                : 'Failed to submit. Please try again.';
            set({ submitting: false, submitMessage: errMsg, submitSuccess: false });
            return { success: false };
        }
    },

    // ── Reset state ───────────────────────────────────────
    resetState: () => set({
        rows: [createEmptyRow()],
        loading: false,
        fetchError: null,
        warningMessage: null,
        submitting: false,
        submitMessage: null,
        submitSuccess: false,
    }),
}));

export default useRegularizationStore;
