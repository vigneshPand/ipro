import React from 'react';
import CommonHistoryCard from '../common/HistoryCard';

const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
        case 'approved': return '#10b981';
        case 'rejected': return '#ef4444';
        case 'pending': return '#f59e0b';
        case 'withdraw': return '#ebabf7ff';
        default: return '#6b7280';
    }
};

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${String(date.getDate()).padStart(2, '0')}-${date.toLocaleString('default', { month: 'short' })}-${date.getFullYear()}`;
};

const HistoryCard = ({ date, startDate, endDate, status, assignedToName, reviewedByName, onPress }) => {
    const isPending = status?.toLowerCase() === 'pending';
    const title = startDate ? `${formatDate(startDate)} to ${formatDate(endDate)}` : formatDate(date);

    // Replicate exactly original details logic
    const details = [
        { label: 'Date:', value: formatDate(date) }
    ];

    if (isPending) {
        details.push({ label: 'Approval Pending With:', value: assignedToName || '-' });
    } else {
        details.push({ label: 'Reviewed By:', value: reviewedByName || '-' });
        details.push({ label: 'Status:', value: status, color: getStatusColor(status) });
    }

    return (
        <CommonHistoryCard
            title={title}
            status={!isPending ? status : null} // Only map top badge if not pending to match legacy
            onPress={onPress}
            details={details}
        />
    );
};

export default HistoryCard;
