import React from 'react';
import CommonHistoryCard from '../common/HistoryCard';
import { formatMinutesToTime } from '../../utils/dateUtils';

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${String(date.getDate()).padStart(2, '0')}-${date.toLocaleString('default', { month: 'short' })}-${date.getFullYear()}`;
};

const PendingLeaveCard = ({ userName, type, days, status, pendingWith, startDate, endDate, onPress }) => {
    const isPermission = type === 'Permission';

    return (
        <CommonHistoryCard
            title={type}
            status={status}
            onPress={onPress}
            details={[
                ...(userName ? [{ label: 'Employee Name:', value: userName }] : []),
                { label: isPermission ? 'Date:' : 'Start Date:', value: formatDate(startDate) },
                ...(isPermission ? [] : [{ label: 'End Date:', value: formatDate(endDate) }]),
                { label: isPermission ? 'No of Hours:' : 'No of Days:', value: isPermission ? formatMinutesToTime(days * 60) : days },
                { label: 'Pending With:', value: pendingWith }
            ]}
        />
    );
};

export default PendingLeaveCard;
