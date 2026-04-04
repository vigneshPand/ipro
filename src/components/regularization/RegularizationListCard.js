import React from 'react';
import CommonHistoryCard from '../common/HistoryCard';

import { formatDate } from '../../utils/dateUtils';

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
