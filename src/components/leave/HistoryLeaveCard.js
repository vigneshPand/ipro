import React from 'react';
import CommonHistoryCard from '../common/HistoryCard';
import { formatMinutesToTime } from '../../utils/dateUtils';

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${String(date.getDate()).padStart(2, '0')}-${date.toLocaleString('default', { month: 'short' })}-${date.getFullYear()}`;
};

const HistoryLeaveCard = ({ item, onPress }) => {
    const isPermission = item.type === 'Permission';
    const userName = item.userName || item.name;

    return (
        <CommonHistoryCard
            title={item.type}
            status={item.status}
            onPress={() => onPress(item)}
            details={[
                ...(userName ? [{ label: 'Employee Name:', value: userName }] : []),
                { label: isPermission ? 'Date:' : 'Start Date:', value: formatDate(item.startDate) },
                ...(isPermission ? [] : [{ label: 'End Date:', value: formatDate(item.endDate) }]),
                { label: isPermission ? 'Duration:' : 'No of Days:', value: isPermission ? formatMinutesToTime(item.noOfDays * 60) : item.noOfDays },
                { label: 'Reviewed By:', value: item.reviewedBy || 'N/A' }
            ]}
        />
    );
};

export default HistoryLeaveCard;
