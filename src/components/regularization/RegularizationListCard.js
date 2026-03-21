import React from 'react';
import CommonHistoryCard from '../common/HistoryCard';

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${String(date.getDate()).padStart(2, '0')}-${date.toLocaleString('default', { month: 'short' })}-${date.getFullYear()}`;
};

const RegularizationListCard = ({ item, onPress }) => {
    return (
        <CommonHistoryCard
            title="Regularization"
            status="PENDING"
            onPress={() => onPress(item)}
            details={[
                { label: 'Date:', value: formatDate(item.date) },
                { label: 'Pending With:', value: item.pendingWith || '-' }
            ]}
        />
    );
};

export const RegularizationHistoryCard = ({ item, onPress }) => {
    return (
        <CommonHistoryCard
            title="Regularization"
            status={item.status}
            onPress={() => onPress(item)}
            details={[
                { label: 'Date:', value: formatDate(item.regularizationDate) }
            ]}
        />
    );
};

export default RegularizationListCard;
