import React from 'react';
import CommonHistoryCard from '../common/HistoryCard';

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${String(date.getDate()).padStart(2, '0')}-${date.toLocaleString('default', { month: 'short' })}-${date.getFullYear()}`;
};

const HistoryLeaveCard = ({ item, onPress }) => {
    return (
        <CommonHistoryCard
            title={item.type}
            status={item.status}
            onPress={() => onPress(item)}
            details={[
                { label: 'Start Date:', value: formatDate(item.startDate) },
                { label: 'End Date:', value: formatDate(item.endDate) },
                { label: 'No of Days:', value: item.noOfDays },
                { label: 'Reviewed By:', value: item.reviewedBy || 'N/A' }
            ]}
        />
    );
};

export default HistoryLeaveCard;
