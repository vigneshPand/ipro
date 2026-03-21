import React, { memo, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableWithoutFeedback,
    TouchableOpacity,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    withSpring,
    Easing
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/FontAwesome6';
import Icons from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../../utils/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CELL_MARGIN = 4;
const CELL_SIZE = (SCREEN_WIDTH - 32 - (CELL_MARGIN * 14)) / 7;
const CELL_HEIGHT = CELL_SIZE * 2.75;

const STATUS_COLORS = {
    Present: '#e8f5e9',
    Absent: '#ffebee',
    'Week-Off': '#e6e3e3ff',
    Holiday: '#f3e5f5',
    Leave: '#e3f2fd',
    'Pending Approval': '#fff8e1',
};

const STATUS_TEXT_COLORS = {
    Present: '#2e7d32',
    Absent: '#c62828',
    'Week-Off': '#888888',
    Holiday: '#6a1b9a',
    Leave: '#1565c0',
};

// 🔥 Workmode colors
const WORKMODE_COLORS = {
    home: '#f5a6a5ff',
    office: '#8bbeebff',
    client: '#9bf09fff',
};

const getStatusLabel = (item) => {
    const { status, leaveType, permissionMinutes } = item;

    if (permissionMinutes != null && permissionMinutes !== '') return 'PMS';

    if (leaveType) {
        const lt = leaveType.toLowerCase();
        if (lt === 'firsthalf') return 'FHL';
        if (lt === 'secondhalf') return 'SHL';
        if (lt === 'leave') return 'L';
    }

    if (!status || status === 'No Status') return '-';

    switch (status) {
        case 'Present': return 'P';
        case 'Absent': return 'A';
        case 'Week-Off': return 'W';
        case 'Holiday': return 'H';
        case 'Leave': return 'L';
        case 'Pending Approval': return '';
        default: return '-';
    }
};

const getBackgroundColor = (item) => {
    const { status, leaveType } = item;

    if (leaveType) return STATUS_COLORS.Leave;
    if (status === 'Present') return STATUS_COLORS.Present;
    if (status === 'Absent') return STATUS_COLORS.Absent;
    if (status === 'Week-Off') return STATUS_COLORS['Week-Off'];
    if (status === 'Holiday') return STATUS_COLORS.Holiday;
    if (status === 'Pending Approval') return STATUS_COLORS['Pending Approval'];

    return '#ffffff';
};

const getTextColor = (item) => {
    const { status, leaveType, leaveStatus } = item;

    if (leaveType && leaveStatus === 'Pending') return '#e65100';
    if (leaveType) return STATUS_TEXT_COLORS.Leave;

    if (status === 'Present') return STATUS_TEXT_COLORS.Present;
    if (status === 'Absent') return STATUS_TEXT_COLORS.Absent;
    if (status === 'Week-Off') return STATUS_TEXT_COLORS['Week-Off'];
    if (status === 'Holiday') return STATUS_TEXT_COLORS.Holiday;

    return '#999';
};

const AttendanceDayCell = ({
    item,
    index = 0,
    onPress,
    onEditPress,
}) => {
    const {
        date,
        status,
        workingHours,
        leaveType,
        hasPendingOrTransferRegularization,
        permissionMinutes,
        wfhStatus,
        workmode,
        isFuture,
        isEmpty,
        leaveStatus
    } = item || {};

    // Card click restricted to Present, WFH Pending, Partial Leave (FHL/SHL), and Permissions (PMS)
    const canPress = !isFuture && (
        status === 'Present' ||
        wfhStatus === 'Pending' ||
        (permissionMinutes != null && permissionMinutes !== '') ||
        (leaveType && (leaveType.toLowerCase() === 'firsthalf' || leaveType.toLowerCase() === 'secondhalf'))
    );

    // Edit icon shows when hasPendingOrTransferRegularization === true AND working hours is not null
    const showEditIcon =
        !isFuture &&
        (
            !!hasPendingOrTransferRegularization ||
            wfhStatus === 'Pending' ||
            leaveStatus === 'Pending'
        );

    let workModeIcon = null;
    const wm = (workmode || '').toLowerCase();
    if (wm === 'home') workModeIcon = 'home';
    else if (wm === 'office') workModeIcon = 'office-building';
    else if (wm === 'client') workModeIcon = 'account-group';

    const opacity = useSharedValue(0);
    const scale = useSharedValue(0.95);
    const pressScale = useSharedValue(1);

    const SMALL_LABELS = ['FHL', 'SHL', 'PMS'];
    const getStatusFontSize = (label) =>
        SMALL_LABELS.includes(label) ? 13 : 13;

    useEffect(() => {
        if (!isEmpty) {
            opacity.value = withDelay(index * 10, withTiming(1, { duration: 200 }));
            scale.value = withDelay(index * 10, withTiming(1));
        }
    }, [index, isEmpty, opacity, scale]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ scale: scale.value }, { scale: pressScale.value }],
    }));

    if (isEmpty) return <View style={[styles.cell, styles.emptyCell]} />;

    const bgColor = getBackgroundColor(item);
    const textColor = getTextColor(item);
    const statusLabel = getStatusLabel(item);

    const showHours = status && status !== 'Week-Off' && status !== 'Holiday' && status !== 'Leave' && leaveType?.toLowerCase() !== 'leave';

    return (
        <View style={styles.cellWrapper}>
            <TouchableWithoutFeedback
                onPress={canPress ? onPress : undefined}
                disabled={!canPress}
            >
                <Animated.View style={[styles.cell, { backgroundColor: bgColor }, animatedStyle]}>

                    {/* 🔥 CORNER RIBBON */}
                    {workModeIcon && (
                        <View style={styles.ribbonWrapper}>
                            <View style={[
                                styles.ribbon,
                                { backgroundColor: WORKMODE_COLORS[wm] || '#43a047' }
                            ]}>
                                <Icons
                                    name={workModeIcon}
                                    size={12}
                                    color={COLORS.darkText}
                                    style={{ transform: [{ rotate: '-45deg' }] }}
                                />
                            </View>
                        </View>
                    )}

                    {/* TOP LAYER */}
                    <View style={styles.topRow}>
                        <Text style={[styles.dateText, { color: textColor }]} numberOfLines={1} ellipsizeMode="tail">
                            {date}
                        </Text>
                    </View>

                    {/* CENTER LAYER */}
                    <View style={styles.center}>
                        {statusLabel ? (
                            <Text style={[
                                styles.statusLabelText,
                                {
                                    color: textColor,
                                    fontSize: getStatusFontSize(statusLabel),
                                }
                            ]} numberOfLines={1}>
                                {statusLabel}
                            </Text>
                        ) : null}
                        {showEditIcon && (
                            <TouchableOpacity
                                style={styles.editIconOverlay}
                                onPress={() => onEditPress && onEditPress(item)}
                                activeOpacity={0.7}
                            >
                                <Icon name="edit" size={14} color={COLORS.orange} />
                            </TouchableOpacity>
                        )}
                    </View>
                    {/* BOTTOM LAYER */}
                    <View style={styles.bottomRow}>
                        {showHours ? (
                            <Text style={styles.hours} numberOfLines={1}>
                                {workingHours || '00:00'}
                            </Text>
                        ) : null}
                    </View>

                </Animated.View>
            </TouchableWithoutFeedback>
        </View>
    );
};

const styles = StyleSheet.create({
    cellWrapper: {
        position: 'relative',
    },
    cell: {
        width: CELL_SIZE,
        height: CELL_HEIGHT,
        margin: CELL_MARGIN,
        borderRadius: 6,
        padding: 6,
        justifyContent: 'space-between',
        overflow: 'hidden',
    },
    emptyCell: {
        backgroundColor: 'transparent',
    },

    dateText: {
        fontSize: 14,
        fontWeight: 'bold',
    },

    topRow: {
        height: 20,
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
    },

    center: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },

    bottomRow: {
        height: 16,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },

    hours: {
        fontSize: 10,
        textAlign: 'center',
    },

    statusLabelText: {
        fontWeight: 'bold',
    },

    // ✏️ Edit icon overlay
    editIconOverlay: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#fff4e5',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
        elevation: 5,
    },

    // 🔥 RIBBON
    ribbonWrapper: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 15,
        height: 15,
        overflow: 'hidden',
    },

    ribbon: {
        position: 'absolute',
        top: -30,
        right: -30,
        width: 75,
        height: 75,
        transform: [{ rotate: '45deg' }],
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default memo(AttendanceDayCell);