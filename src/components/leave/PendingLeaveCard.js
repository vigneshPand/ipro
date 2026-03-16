import React from 'react';
import CommonHistoryCard from '../common/HistoryCard';

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${String(date.getDate()).padStart(2, '0')}-${date.toLocaleString('default', { month: 'short' })}-${date.getFullYear()}`;
};

const PendingLeaveCard = ({ type, days, status, pendingWith, startDate, endDate, onPress }) => {
    return (
        <CommonHistoryCard
            title={type}
            status={status}
            onPress={onPress}
            details={[
                { label: 'Start Date:', value: formatDate(startDate) },
                { label: 'End Date:', value: formatDate(endDate) },
                { label: 'No of Days:', value: days },
                { label: 'Pending With:', value: pendingWith }
            ]}
        />
    );
};

export default PendingLeaveCard;
