import { COLORS } from './theme';

export const STATUS_COLORS = {
    Present: '#e8f5e9',
    Absent: '#ffebee',
    'Week-Off': '#e6e3e3ff',
    Holiday: '#f3e5f5',
    Leave: '#e3f2fd',
    'Pending Approval': '#fff8e1',
};

export const STATUS_TEXT_COLORS = {
    Present: '#2e7d32',
    Absent: '#c62828',
    'Week-Off': '#888888',
    Holiday: '#6a1b9a',
    Leave: '#1565c0',
};

export const WORKMODE_COLORS = {
    home: '#f5a6a5ff',
    office: '#8bbeebff',
    client: '#9bf09fff',
};

export const getStatusLabel = (item) => {
    const { status, leaveType, permissionMinutes } = item || {};

    if (permissionMinutes != null && permissionMinutes !== '') return 'PMS';

    if (leaveType) {
        const lt = leaveType.toLowerCase();
        if (lt === 'fhl' || lt === 'firsthalf') return 'FHL';
        if (lt === 'shl' || lt === 'secondhalf') return '(SHL)';
        if (lt === 'leave') return '(L)';
    }

    if (!status || status === 'No Status') return '-';

    switch (status) {
        case 'Present': return '(P)';
        case 'Absent': return '(A)';
        case 'Week-Off': return '(W)';
        case 'Holiday': return '(H)';
        case 'Leave': return '(L)';
        case 'Pending Approval': return '';
        default: return '-';
    }
};

export const getBackgroundColor = (item) => {
    const { status, leaveType, regularizationStatus, permissionStatus } = item || {};

    if (permissionStatus === 'Pending') return STATUS_COLORS['Pending Approval'];
    if (leaveType && !regularizationStatus) return STATUS_COLORS.Leave;
    if (status === 'Present') return STATUS_COLORS.Present;
    if (status === 'Absent') return STATUS_COLORS.Absent;
    if (status === 'Week-Off') return STATUS_COLORS['Week-Off'];
    if (status === 'Holiday') return STATUS_COLORS.Holiday;
    if (status === 'Pending Approval') return STATUS_COLORS['Pending Approval'];

    return '#ffffff';
};

export const getTextColor = (item) => {
    const { status, leaveType, leaveStatus, permissionStatus } = item || {};

    if (permissionStatus === 'Pending') return '#e65100';
    if (leaveType && leaveStatus === 'Pending') return '#e65100';
    if (leaveType) return STATUS_TEXT_COLORS.Leave;

    if (status === 'Present') return STATUS_TEXT_COLORS.Present;
    if (status === 'Absent') return STATUS_TEXT_COLORS.Absent;
    if (status === 'Week-Off') return STATUS_TEXT_COLORS['Week-Off'];
    if (status === 'Holiday') return STATUS_TEXT_COLORS.Holiday;

    return '#999';
};
