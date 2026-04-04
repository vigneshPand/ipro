import React from 'react';
import CommonHistoryCard from '../../../components/common/HistoryCard';

import { formatDate } from '../../../utils/dateUtils';

const HistoryCompOffCard = ({ item, onPress }) => {

    const details = [
        { label: 'Date:', value: formatDate(item.date) },
        { label: 'Applied On:', value: formatDate(item.appliedOnDate || item.recordCreatedAt || item.appliedOn) }
    ];

    return (
        <CommonHistoryCard
            title="Comp-Off Request"
            status={item?.status} // Top badge only for approved/rejected/etc.
            onPress={() => onPress(item)}
            details={details}
        />
    );
};

export default HistoryCompOffCard;
