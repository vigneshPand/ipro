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

// Helper: format Date for display (e.g. "5-Mar-2026")
export const formatDate = (date) => {
    return `${date.getDate()}-${date.toLocaleString('default', { month: 'short' })}-${date.getFullYear()}`;
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
