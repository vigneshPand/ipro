import React from 'react';
import CommonHistoryCard from '../common/HistoryCard';

const LeaveHistoryCard = ({ item, onPress }) => {
    return (
        <CommonHistoryCard
            title={item.leaveType}
            status={item.status}
            onPress={() => onPress(item)}
            details={[
                { label: 'Duration:', value: item.duration },
                { label: 'No of Days:', value: item.noOfDays },
                { label: 'Reviewed By:', value: item.reviewedBy }
            ]}
        />
    );
};

export default LeaveHistoryCard;
