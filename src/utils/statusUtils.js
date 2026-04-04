/**
 * Common status colors for all modules.
 */
export const getStatusColor = (status = '') => {
    switch (status?.toLowerCase()) {
        case 'approved': return '#10b981'; // green
        case 'rejected': return '#ef4444'; // red
        case 'pending': return '#f59e0b'; // orange
        case 'withdraw': return '#e4b5edff'; // purple
        default: return '#6b7280'; // gray
    }
};
