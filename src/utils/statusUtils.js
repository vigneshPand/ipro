/**
 * Common status colors for all modules.
 */
export const getStatusColor = (status = '') => {
    switch (status?.toLowerCase()) {
        case 'approved': return '#10b981';
        case 'rejected': return '#ef4444';
        case 'pending':  return '#f59e0b';
        case 'withdraw': return '#e4b5edff';
        case 'transfer': return '#3b82f6'; // matches COLORS.statusTransfer in theme.js
        default:         return '#6b7280';
    }
};
