// Helper: format Date to YYYY-MM-DD for API calls
export const formatToAPI = (date) => {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

// Helper: parse YYYY-MM-DD safely into a local Date object without UTC overlap
export const parseAPIDate = (dateStr) => {
    const [y, m, d] = dateStr.split('-');
    return new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
};

// Helper: format Date for display (e.g. "05-Mar-2026")
export const formatDate = (dateInput) => {
    if (!dateInput) return '-';
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '-';
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
};

// Helper: auto-format permission HH:MM layout
export const formatPermissionTime = (digits) => {
    if (digits.length !== 4) return digits;

    const hours = parseInt(digits.slice(0, 2), 10);
    const minutes = parseInt(digits.slice(2, 4), 10);

    if (hours > 23 || minutes > 59) {
        return "";
    }

    return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
};

// Helper: convert HH:MM string to total minutes
export const convertTimeToMinutes = (time) => {
    const [hours, minutes] = time.split(":");
    return (Number(hours) * 60) + Number(minutes);
};
// Helper: convert total minutes to HH:MM format
export const formatMinutesToTime = (totalMinutes) => {
    const num = parseFloat(totalMinutes) || 0;
    const hours = Math.floor(num / 60);
    const mins = Math.round(num % 60);
    return `${hours}:${mins.toString().padStart(2, '0')}hrs`;
};

// Helper: get current month date range (YYYY-MM-DD)
export const getMonthRange = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDate = new Date(year, month + 1, 0).getDate();
    const lastDay = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDate).padStart(2, '0')}`;
    return { fromDate: firstDay, toDate: lastDay };
};

/**
 * Format a time string (e.g., "13:49:47") to 12-hour format.
 */
export const formatTime = (timeStr) => {
    if (!timeStr || timeStr === '-' || timeStr === '') return '-';
    try {
        const parts = timeStr.split(':');
        if (parts.length < 2) return timeStr;
        let hours = parseInt(parts[0], 10);
        const minutes = parts[1];
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        return `${hours}:${minutes} ${ampm}`;
    } catch {
        return timeStr;
    }
};

/**
 * Robust number parsing for leave balances and hours.
 */
export const parseNumber = (val) => {
    if (typeof val === 'string' && val.includes('hrs')) {
        const [hours, mins] = val.replace('hrs', '').split(':');
        return parseInt(hours, 10) + parseInt(mins, 10) / 60;
    }
    return parseFloat(val) || 0;
};
