import React from 'react';
import CommonHistoryCard from '../common/HistoryCard';

import { formatDate } from '../../utils/dateUtils';


const TeamRequestCard = ({ item = {}, onPress, type = 'regularization', isHistory = false }) => {
    const isReg = type === 'regularization';

    // ── Field mapping ──
    const name = item?.userName || item?.name || '-';
    const date = isReg ? (item?.date || item?.regularizationDate) : (item?.date || item?.startDate || item?.wfhDate);
    const status = isHistory ? (item?.status || 'PENDING') : 'PENDING';
    const title = isReg ? 'Regularization Request' : 'WFH Request';
    const dateLabel = isReg ? 'Date:' : 'Date:';

    // Additional info
    // const pendingWith = item?.reviewByName || item?.pendingWith || item?.approvedByName || '-';

    const details = [
        { label: 'Employee Name:', value: name },
        { label: dateLabel, value: formatDate(date) },
        // ...(item.emailId ? [{ label: 'Email:', value: item.emailId }] : []),
        // { label: isHistory ? 'Status:' : 'Pending With:', value: isHistory ? status : pendingWith }
    ];

    return (
        <CommonHistoryCard
            title={title}
            status={status}
            details={details}
            onPress={() => onPress && onPress(item)}
        />
    );
};

export default TeamRequestCard;
