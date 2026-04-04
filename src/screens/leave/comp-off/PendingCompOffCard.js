import React from 'react';
import CommonHistoryCard from '../../../components/common/HistoryCard';

import { formatDate } from '../../../utils/dateUtils';

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
