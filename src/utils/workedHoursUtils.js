import moment from 'moment';

const TIME_FORMAT = 'HH:mm:ss';

/**
 * Sums all completed Check In -> Check Out sessions from today's attendance
 * records and, if the latest record is an open Check In, adds the elapsed
 * duration up to `now`. The attendance API response is the single source
 * of truth - no local timer state is trusted.
 */
export const calculateWorkedSeconds = (activities, now = moment()) => {
    if (!Array.isArray(activities) || activities.length === 0) return 0;

    let totalSeconds = 0;
    let openCheckIn = null;

    for (const item of activities) {
        if (!item?.time) continue;
        const timestamp = moment(item.time, TIME_FORMAT);
        if (!timestamp.isValid()) continue;

        if (item.currStatus) {
            openCheckIn = timestamp;
        } else if (openCheckIn) {
            totalSeconds += timestamp.diff(openCheckIn, 'seconds');
            openCheckIn = null;
        }
    }

    if (openCheckIn) {
        totalSeconds += now.diff(openCheckIn, 'seconds');
    }

    return Math.max(0, totalSeconds);
};

/** Formats a duration in seconds as zero-padded HH:mm:ss. */
export const formatWorkedDuration = (totalSeconds) => {
    return moment.utc(Math.max(0, totalSeconds) * 1000).format(TIME_FORMAT);
};

/** True when the latest attendance record today is an open Check In. */
export const isCheckedIn = (activities) => {
    if (!Array.isArray(activities) || activities.length === 0) return false;
    return activities[activities.length - 1]?.currStatus === true;
};
