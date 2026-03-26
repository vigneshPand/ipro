import React from 'react';
import CommonHistoryCard from '../../../components/common/HistoryCard';

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${String(date.getDate()).padStart(2, '0')}-${date.toLocaleString('default', { month: 'short' })}-${date.getFullYear()}`;
};

const PendingCompOffCard = ({ item, onPress }) => {
    return (
        <CommonHistoryCard
            title="Comp-Off Request"
            status={item.status || 'Pending'}
            onPress={() => onPress(item)}
            details={[
                { label: 'Date:', value: formatDate(item.date) },
                { label: 'Pending With:', value: item.assignedToName || item.assignToName || 'N/A' }
            ]}
        />
    );
};

export default PendingCompOffCard;
