import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Icons from 'react-native-vector-icons/FontAwesome6';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
    runOnJS,
} from 'react-native-reanimated';
import Tooltip from 'react-native-walkthrough-tooltip';
import { COLORS, SHADOW } from '../../utils/theme';
import AttendanceService from '../../services/AttendanceService';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const MONTH_NAMES_SHORT = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/**
 * Format a time string (e.g., "13:49:47") to 12-hour format.
 */
const formatTime = (timeStr) => {
    if (!timeStr || timeStr === '-' || timeStr === '') return '-';
    try {
        const parts = timeStr.split(':');
        if (parts.length < 2) return timeStr;
        let hours = parseInt(parts[0], 10);
        const minutes = parts[1];
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        return `${hours}:${minutes} ${ampm}`;
    } catch {
        return timeStr;
    }
};

const formatPermission = (minutes) => {
    if (minutes === null || minutes === undefined || minutes === '') return '00:00 hrs';
    try {
        const total = parseInt(minutes, 10);
        if (isNaN(total)) return '00:00 hrs';
        const h = Math.floor(total / 60);
        const m = total % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} hrs`;
    } catch {
        return '00:00 hrs';
    }
};

const AttendanceDetailModal = ({
    visible,
    onClose,
    selectedDay,
    selectedMonth,
    selectedYear,
    userId,
}) => {
    const translateY = useSharedValue(SCREEN_HEIGHT);
    const [renderModal, setRenderModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [activityData, setActivityData] = useState([]);
    const [apiError, setApiError] = useState(null);

    // Tooltip states
    const [wfhTooltipVisible, setWfhTooltipVisible] = useState(false);
    const [regTooltipVisible, setRegTooltipVisible] = useState(false);
    useEffect(() => {
        if (visible) {
            setRenderModal(true);
            translateY.value = withTiming(0, {
                duration: 300,
                easing: Easing.out(Easing.ease),
            });
        } else {
            translateY.value = withTiming(
                SCREEN_HEIGHT,
                { duration: 250, easing: Easing.in(Easing.ease) },
                (finished) => {
                    if (finished) runOnJS(setRenderModal)(false);
                },
            );
        }
    }, [visible, translateY]);

    // Fetch activity data when modal opens
    const fetchActivityData = useCallback(async () => {
        if (!visible || !selectedDay || !userId) return;

        const day = selectedDay.date;
        const month = String(selectedMonth + 1).padStart(2, '0');
        const dateStr = `${selectedYear}-${month}-${String(day).padStart(2, '0')}`;

        setLoading(true);
        setApiError(null);
        setActivityData([]);

        try {
            const response = await AttendanceService.getUserActivityByDateTableView(
                userId,
                dateStr,
            );
            const data = response?.data;
            if (Array.isArray(data)) {
                setActivityData(data);
            } else if (data && typeof data === 'object') {
                setActivityData([data]);
            } else {
                setActivityData([]);
            }
        } catch (err) {
            // console.error('fetchActivityData error:', err);
            setApiError('Failed to load activity data');
        } finally {
            setLoading(false);
        }
    }, [visible, selectedDay, userId, selectedMonth, selectedYear]);

    useEffect(() => {
        if (visible && selectedDay) {
            fetchActivityData();
        }
    }, [visible, selectedDay, fetchActivityData]);

    const handleClose = () => {
        translateY.value = withTiming(
            SCREEN_HEIGHT,
            { duration: 250, easing: Easing.in(Easing.ease) },
            (finished) => {
                if (finished) runOnJS(onClose)();
            },
        );
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    if (!renderModal && !visible) return null;
    if (!selectedDay) return null;

    const d = selectedDay;
    const raw = d.rawData || {};

    // ─── Modal Header Icons (ONLY place icons appear) ───
    // 1. Leave Approval Pending: leaveStatus === "Pending" → show ⚠️
    const showLeaveApprovalPending = raw.leaveStatus === 'Pending';
    // 2. Regularization Approval Pending: regularizationStatus === true
    const showRegularization = raw.regularizationStatus === true;
    // 3. WFH Approval Pending: wfhStatus === "Pending"
    const showWfhPending = raw.wfhStatus === 'Pending';

    // Date header text: "Stamps of 09 Mar 2026"
    const dayStr = String(d.date).padStart(2, '0');
    const headerDateText = `Stamps of ${dayStr} ${MONTH_NAMES_SHORT[selectedMonth]} ${selectedYear}`;

    return (
        <Modal
            transparent
            visible={renderModal}
            animationType="fade"
            onRequestClose={handleClose}
        >
            <View style={styles.modalOverlay}>
                <TouchableOpacity
                    style={StyleSheet.absoluteFill}
                    activeOpacity={1}
                    onPress={handleClose}
                />
                <Animated.View
                    style={[styles.modalContent, animatedStyle]}
                >
                    {/* ─── Modal Header ─── */}
                    <View style={styles.modalHeader}>
                        <View style={styles.headerLeft}>
                            <Text style={styles.modalTitle}>{headerDateText}</Text>
                        </View>
                        <View style={styles.headerRight}>
                            {/* Leave Approval Pending ⚠️ (moved from grid to modal) */}
                            {showLeaveApprovalPending && (
                                <View style={styles.leaveApprovalIconWrap}>
                                    <Icons name="circle-exclamation" size={16} color={COLORS.red} />
                                </View>
                            )}
                            {/* WFH Approval Pending */}
                            {showWfhPending && (
                                <Tooltip
                                    isVisible={wfhTooltipVisible}
                                    content={
                                        <Text style={styles.tooltipText}>
                                            WFH Approval Pending
                                        </Text>
                                    }
                                    placement="bottom"
                                    onClose={() => setWfhTooltipVisible(false)}
                                    contentStyle={styles.tooltipContent}
                                >
                                    <TouchableOpacity
                                        style={styles.wfhPendingIconWrap}
                                        onPress={() => setWfhTooltipVisible(true)}
                                    >
                                        <Icons name="house-circle-exclamation" size={14} color="#f25d3bff" />
                                    </TouchableOpacity>
                                </Tooltip>
                            )}
                            {/* Regularization Approval Pending */}
                            {showRegularization && (
                                <Tooltip
                                    isVisible={regTooltipVisible}
                                    content={
                                        <Text style={styles.tooltipText}>
                                            Regularization Pending Approval
                                        </Text>
                                    }
                                    placement="bottom"
                                    onClose={() => setRegTooltipVisible(false)}
                                    contentStyle={styles.tooltipContent}
                                >
                                    <TouchableOpacity
                                        style={styles.regularizationIconWrap}
                                        onPress={() => setRegTooltipVisible(true)}
                                    >
                                        <Text style={styles.regularizationText}>R</Text>
                                    </TouchableOpacity>
                                </Tooltip>
                            )}
                            {/* Close button */}
                            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                                <Icon name="close" size={22} color="#666" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* ─── Content ─── */}
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color={COLORS.blue} />
                            <Text style={styles.loadingText}>Loading stamps...</Text>
                        </View>
                    ) : apiError ? (
                        <View style={styles.errorContainer}>
                            <Icon name="alert-circle-outline" size={28} color={COLORS.grayText} />
                            <Text style={styles.errorText}>{apiError}</Text>
                            <TouchableOpacity
                                style={styles.retryBtn}
                                onPress={fetchActivityData}
                            >
                                <Text style={styles.retryText}>Retry</Text>
                            </TouchableOpacity>
                        </View>
                    ) : activityData.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Icon name="document-text-outline" size={28} color={COLORS.grayText} />
                            <Text style={styles.emptyText}>No stamp records available</Text>
                        </View>
                    ) : (
                        <ScrollView
                            style={styles.scrollView}
                            showsVerticalScrollIndicator={false}
                            nestedScrollEnabled
                        >
                            {activityData.map((row, idx) => {
                                const regStatus = row.regularizationStatus || '-';
                                const mode = row.workModeIn || row.workModeOut || row.workmode || 'N/A';
                                const perm = formatPermission(row.permissionMinutes);
                                const inTime = formatTime(row.timeIn || row.loginTime || '');
                                const outTime = formatTime(row.timeOut || row.logoutTime || '');
                                const remarks = row.remarksIn || row.remarksOut || row.remarks || '-';

                                const isPendingReg = regStatus.toLowerCase() === 'pending';

                                return (
                                    <View key={`stamp-${idx}`} style={styles.stampCard}>
                                        {/* Card Top: Mode & Reg Status */}
                                        <View style={styles.cardTopRow}>
                                            <View style={styles.modeIndicator}>
                                                {mode.toLowerCase() === 'home' ? (
                                                    <Icons name="house" size={14} color={COLORS.primary} style={styles.modeIcon} />
                                                ) : (
                                                    <Icons name="building" size={14} color={COLORS.primary} style={styles.modeIcon} />
                                                )}
                                                <Text style={styles.modeText}>{mode}</Text>
                                            </View>
                                            <View style={[
                                                styles.regBadge,
                                                isPendingReg ? styles.regBadgePending : styles.regBadgeDefault
                                            ]}>
                                                <Text style={[
                                                    styles.regBadgeText,
                                                    isPendingReg ? styles.regBadgeTextPending : styles.regBadgeTextDefault
                                                ]}>
                                                    {regStatus}
                                                </Text>
                                                {isPendingReg && (
                                                    <View style={styles.miniWarningDot}>
                                                        <Text style={styles.miniWarningDotText}>!</Text>
                                                    </View>
                                                )}
                                            </View>
                                        </View>

                                        {/* Card Middle: Times */}
                                        <View style={styles.timesContainer}>
                                            <View style={styles.timeBox}>
                                                <View style={styles.greenArrowBg}>
                                                    <Icons name="arrow-trend-up" size={10} color="#fff" />
                                                </View>
                                                <View>
                                                    <Text style={styles.timeLabel}>In Time</Text>
                                                    <Text style={styles.timeValue}>{inTime}</Text>
                                                </View>
                                            </View>
                                            <View style={styles.timeBox}>
                                                <View style={styles.orangeArrowBg}>
                                                    <Icons name="arrow-trend-down" size={10} color="#fff" />
                                                </View>
                                                <View>
                                                    <Text style={styles.timeLabel}>Out Time</Text>
                                                    <Text style={styles.timeValue}>{outTime}</Text>
                                                </View>
                                            </View>
                                        </View>

                                        <View style={styles.cardDivider} />

                                        {/* Card Bottom: Permission & Remarks */}
                                        <View style={styles.cardFooter}>
                                            <View style={styles.footerItem}>
                                                <Text style={styles.footerLabel}>Permission:</Text>
                                                <Text style={styles.footerValue}>{perm}</Text>
                                            </View>
                                            <View style={styles.footerItem}>
                                                <Text style={styles.footerLabel}>Remarks:</Text>
                                                <Text style={styles.remarksValue} numberOfLines={3}>{remarks}</Text>
                                            </View>
                                        </View>
                                    </View>
                                );
                            })}
                        </ScrollView>
                    )}
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        paddingBottom: 36,
        maxHeight: SCREEN_HEIGHT * 0.75,
        minHeight: SCREEN_HEIGHT * 0.65,
        ...SHADOW,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerLeft: {
        flex: 1,
        marginRight: 8,
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    // Leave Approval Pending (orange dot with !)
    leaveApprovalIconWrap: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    leaveApprovalDot: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#e65100',
        alignItems: 'center',
        justifyContent: 'center',
    },
    leaveApprovalDotText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        lineHeight: 15,
    },
    // WFH Approval Pending
    wfhPendingIconWrap: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#fff4e5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Regularization Approval Pending (R badge)
    regularizationIconWrap: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: '#FFE8D1',
        alignItems: 'center',
        justifyContent: 'center',
    },
    regularizationText: {
        color: '#e65100',
        fontSize: 13,
        fontWeight: 'bold',
    },
    editBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#fff4e5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#f5f5f5',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Loading / Error / Empty states
    loadingContainer: {
        paddingVertical: 32,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 8,
        fontSize: 13,
        color: COLORS.grayText,
    },
    errorContainer: {
        paddingVertical: 24,
        alignItems: 'center',
    },
    errorText: {
        marginTop: 8,
        fontSize: 13,
        color: COLORS.grayText,
    },
    retryBtn: {
        marginTop: 12,
        paddingHorizontal: 20,
        paddingVertical: 8,
        backgroundColor: COLORS.blue,
        borderRadius: 8,
    },
    retryText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    emptyContainer: {
        paddingVertical: 24,
        alignItems: 'center',
    },
    emptyText: {
        marginTop: 8,
        fontSize: 13,
        color: COLORS.grayText,
    },

    // Scroll view - FIXED: Changed from maxHeight to flex: 1
    scrollView: {
        flex: 1,
    },


    // Card styles
    stampCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#f0f0f0',
        ...SHADOW,
    },
    cardTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    modeIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    modeIcon: {
        marginRight: 6,
    },
    modeText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    regBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
    },
    regBadgePending: {
        backgroundColor: '#fff4e5',
    },
    regBadgeDefault: {
        backgroundColor: '#f0f4fa',
    },
    regBadgeText: {
        fontSize: 11,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    regBadgeTextPending: {
        color: '#e65100',
    },
    regBadgeTextDefault: {
        color: COLORS.primary,
    },
    timesContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    timeBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    timeLabel: {
        fontSize: 11,
        color: COLORS.grayText,
        marginBottom: 2,
    },
    timeValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.darkText,
    },
    greenArrowBg: {
        backgroundColor: '#2e7d32',
        width: 22,
        height: 22,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    orangeArrowBg: {
        backgroundColor: '#e65100',
        width: 22,
        height: 22,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    cardDivider: {
        height: 1,
        backgroundColor: '#f5f5f5',
        marginBottom: 12,
    },
    cardFooter: {
        gap: 8,
    },
    footerItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    footerLabel: {
        fontSize: 12,
        color: COLORS.grayText,
        width: 80,
    },
    footerValue: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.darkText,
        flex: 1,
    },
    remarksValue: {
        fontSize: 13,
        color: '#555',
        flex: 1,
        fontStyle: 'italic',
    },
    miniWarningDot: {
        backgroundColor: '#e65100',
        width: 14,
        height: 14,
        borderRadius: 7,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 6,
    },
    miniWarningDotText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: 'bold',
        lineHeight: 12,
    },
    tooltipContent: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 2,
        borderColor: '#c74b4bff',
        borderWidth: 1,
        backgroundColor: '#e9e59eff',
    },
    tooltipText: {
        color: COLORS.text,
        fontSize: 12,
        fontWeight: '600',
    },
});

export default AttendanceDetailModal;