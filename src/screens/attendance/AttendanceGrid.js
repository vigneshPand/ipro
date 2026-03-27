import React, { useEffect, useCallback, useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import Icons from 'react-native-vector-icons/FontAwesome6';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SHADOW } from '../../utils/theme';
import AuthService from '../../services/AuthService';
import useAttendanceGridStore from '../../store/useAttendanceGridStore';
import AttendanceDayCell from './AttendanceDayCell';
import AttendanceDetailModal from './AttendanceDetailModal';
import RegularizationEditModal from './RegularizationEditModal';
import useRegularizationStore from '../../store/useRegularizationStore';

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const SCREEN_WIDTH = Dimensions.get('window').width;
const CELL_MARGIN = 4;
const CELL_SIZE = (SCREEN_WIDTH - 32 - (CELL_MARGIN * 14)) / 7;
const CELL_HEIGHT = CELL_SIZE * 2.8;

/**
 * Legend items with their status colors (matching web).
 */
const LEGEND_COLOR_ITEMS = [
    { label: 'Present (P)', color: '#e8f5e9', border: '#c8e6c9' },
    { label: 'Absent (A)', color: '#ffebee', border: '#ffcdd2' },
    { label: 'Week-Off (W)', color: '#e6e3e3ff', border: '#e0e0e0' },
    { label: 'Leave', color: '#e3f2fd', border: '#bbdefb' },
    { label: 'Holiday (H)', color: '#f3e5f5', border: '#e1bee7' },
    { label: 'First Half Leave', color: '#e3f2fd', border: '#bbdefb' },
    { label: 'Second Half Leave', color: '#e3f2fd', border: '#bbdefb' },
];
// Separate icon-based legend item
const WFH_APPROVAL_PENDING = 'WFH Approval Pending';
const LEAVE_APPROVAL_PENDING = 'Leave Approval Pending';
const REGULARIZATION_APPROVAL_PENDING = 'Regularization Approval Pending';
const LEAVE_WITHDRAWN = 'Leave can only be withdrawn within 3 days.';
const REGULARIZE = 'Regularize';

const AttendanceGridScreen = ({ navigation }) => {
    const {
        selectedYear,
        selectedMonth,
        attendanceData,
        loading,
        error,
        goNextMonth,
        goPrevMonth,
        fetchCalendarStatus,
    } = useAttendanceGridStore();

    const [selectedDay, setSelectedDay] = useState(null);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [userId, setUserId] = useState(null);

    // Edit modal state (opened directly from grid edit icon)
    const { editModalVisible, openEditModal, closeEditModal } = useRegularizationStore();
    const [editDate, setEditDate] = useState(null);
    const [editHeaderLabel, setEditHeaderLabel] = useState('');

    // ─────────── Load data on mount & month change ───────────
    const loadData = useCallback(async () => {
        try {
            const user = await AuthService.getUserInfo();
            if (user?.userId) {
                setUserId(user.userId);
                await fetchCalendarStatus(user.userId);
            }
        } catch (err) {
            console.error('AttendanceGrid loadData error:', err);
        }
    }, [fetchCalendarStatus]);

    useFocusEffect(
        useCallback(() => {
            loadData();
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [loadData, selectedMonth, selectedYear])
    );

    // ─────────── Build calendar grid data ───────────
    const calendarGrid = useMemo(() => {
        const year = selectedYear;
        const month = selectedMonth;
        const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0=Sun
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();
        const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
        const todayDate = today.getDate();

        // Build a lookup map: date string → data object
        const dataMap = {};
        (attendanceData || []).forEach((item) => {
            const d = item.date || item.day;
            if (d) {
                const dayNum = typeof d === 'string'
                    ? parseInt(d.split('-').pop(), 10)
                    : d;
                dataMap[dayNum] = item;
            }
        });

        const gridItems = [];

        // Leading empty cells for alignment
        const prevMonthLastDate = new Date(year, month, 0).getDate();

        for (let i = 0; i < firstDayOfMonth; i++) {
            gridItems.push({
                key: `leading-${i}`,
                isEmpty: false,
                date: prevMonthLastDate - firstDayOfMonth + i + 1,
                isLeading: true,
                monthOffset: -1, // ✅ important
            });
        }

        // Actual days
        for (let day = 1; day <= daysInMonth; day++) {
            const data = dataMap[day] || {};
            gridItems.push({
                key: `day-${day}`,
                isEmpty: false,
                date: day,
                status: data.status || null,
                workingHours: data.workingHours || null,
                workmode: data.workmode || data.workMode || null,
                leaveType: data.leaveType || null,
                leaveStatus: data.leaveStatus || null,
                permissionMinutes: data.permissionMinutes || null,
                permissionStatus: data.permissionStatus || null,
                regularizationStatus: data.regularizationStatus || false,
                wfhStatus: data.wfhStatus || null,
                hasPendingOrTransferRegularization:
                    data.hasPendingOrTransferRegularization || false,
                isToday: isCurrentMonth && day === todayDate,
                isFuture: isCurrentMonth && day > todayDate,
                rawData: data,
            });
        }

        // Trailing empty cells to fill the last row
        // Trailing next month dates (UI only)
        const remainder = gridItems.length % 7;
        if (remainder !== 0) {
            const trailingCount = 7 - remainder;

            for (let i = 1; i <= trailingCount; i++) {
                gridItems.push({
                    key: `trail-${i}`,
                    isEmpty: false,
                    isTrailing: true,
                    date: i,
                    monthOffset: 1, // ✅ important
                });
            }
        }

        return gridItems;
    }, [selectedYear, selectedMonth, attendanceData]);

    // Auto-select today on first load
    useEffect(() => {
        if (calendarGrid?.length > 0 && !selectedDay) {
            const todayItem = calendarGrid.find(i => i.isToday);
            if (todayItem) {
                setSelectedDay(todayItem);
            }
        }
    }, [calendarGrid, selectedDay]);

    // ─────────── Handlers ───────────
    const handlePrevMonth = useCallback(() => {
        goPrevMonth();
    }, [goPrevMonth]);

    const handleNextMonth = useCallback(() => {
        goNextMonth();
    }, [goNextMonth]);

    const handleDayPress = useCallback((item) => {
        if (item.isEmpty) return;

        const isPermissionPending =
            item.permissionStatus === 'Pending' ||
            (item.permissionMinutes != null && item.permissionMinutes !== '');

        const isValidStatus =
            item.status === 'Present' ||
            item.wfhStatus === 'Pending' ||
            isPermissionPending ||
            (item.leaveType &&
                item.leaveType.toLowerCase() === 'leave' &&
                item.status === 'Pending Approval') ||
            (item.leaveType &&
                (item.leaveType.toLowerCase() === 'firsthalf' ||
                    item.leaveType.toLowerCase() === 'secondhalf')) ||
            item.regularizationStatus;

        const canPress =
            !item.isTrailing && // still block next month
            (
                (!item.isFuture) || isPermissionPending
            ) &&
            isValidStatus;

        if (!canPress) return;

        setSelectedDay(item);
        setDetailModalVisible(true);
    }, []);

    // Edit icon click → directly open RegularizationEditModal (no timestamp API)
    const handleEditPress = useCallback((item) => {
        if (!item || item.isEmpty) return;

        const MONTH_NAMES_SHORT = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
        ];

        const month = String(selectedMonth + 1).padStart(2, '0');
        const day = String(item.date).padStart(2, '0');
        const dateStr = `${selectedYear}-${month}-${day}`;
        setEditDate(dateStr);
        setEditHeaderLabel(`Edit – ${day} ${MONTH_NAMES_SHORT[selectedMonth]} ${selectedYear}`);
        openEditModal();
    }, [selectedMonth, selectedYear, openEditModal]);

    const keyExtractor = useCallback((item) => item.key, []);

    // ─────────── Render helpers ───────────
    const renderDayCell = useCallback(({ item, index }) => {
        if (item.isEmpty) {
            return <View style={styles.emptyCellPlaceholder} />;
        }
        return (
            <AttendanceDayCell
                item={item}
                index={index}
                isSelected={selectedDay?.key === item.key}
                onPress={() => handleDayPress(item)}
                onEditPress={handleEditPress}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
            />
        );
    }, [handleDayPress, handleEditPress, selectedDay, selectedMonth, selectedYear]);

    // ─────────── Main render ───────────
    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.menuButton}>
                        <MCIcon name="menu" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Attendance Grid</Text>
                </View>
            </View>

            {/* Month Navigation */}
            <View style={styles.monthNav}>
                <TouchableOpacity onPress={handlePrevMonth} style={styles.navButton}>
                    <Icon name="chevron-back" size={22} color={COLORS.primary} />
                </TouchableOpacity>
                <Text style={styles.monthLabel}>
                    {MONTH_NAMES[selectedMonth]} {selectedYear}
                </Text>
                <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
                    <Icon name="chevron-forward" size={22} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            {/* Legend */}
            <View style={styles.legendContainer}>
                {LEGEND_COLOR_ITEMS.map((item) => (
                    <View key={item.label} style={styles.legendItem}>
                        <View style={[styles.legendBox, { backgroundColor: item.color, borderColor: item.border }]} />
                        <Text style={styles.legendText}>{item.label}</Text>
                    </View>
                ))}
                {/* ⚠️ icon legend */}
                <View style={styles.legendItem}>
                    <Icons name="circle-exclamation" size={15} color={COLORS.red} />
                    <Text style={styles.legendsText}>{LEAVE_WITHDRAWN}</Text>
                </View>
                <View style={styles.legendItem}>
                    <Icons name="circle-exclamation" size={15} color={COLORS.red} />
                    <Text style={styles.legendsText}>{LEAVE_APPROVAL_PENDING}</Text>
                </View>
                <View style={styles.legendItem}>
                    <Icons name="house-circle-exclamation" size={14} color="#f25d3bff" />
                    <Text style={styles.legendsText}>{WFH_APPROVAL_PENDING}</Text>
                </View>
                <View style={styles.legendItem}>
                    <Icons name="edit" size={15} color={COLORS.orange} />
                    <Text style={styles.legendsText}>{REGULARIZE}</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={styles.regularizationIconWrap}>
                        <Text style={styles.regularizationText}>R</Text>
                    </View>
                    <Text style={styles.legendsText}>{REGULARIZATION_APPROVAL_PENDING}</Text>
                </View>

            </View>

            {/* Day Headers */}
            <View style={styles.dayHeaderRow}>
                {DAY_HEADERS.map((day) => (
                    <View key={day} style={styles.dayHeaderCell}>
                        <Text style={styles.dayHeaderText}>{day}</Text>
                    </View>
                ))}
            </View>

            {/* Grid Content */}
            {loading ? (
                <View style={styles.centeredContainer}>
                    <ActivityIndicator size="large" color={COLORS.blue} />
                    <Text style={styles.loadingText}>Loading attendance...</Text>
                </View>
            ) : error ? (
                <View style={styles.centeredContainer}>
                    <Icon name="alert-circle-outline" size={48} color={COLORS.grayText} />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={loadData}>
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={calendarGrid}
                    renderItem={renderDayCell}
                    keyExtractor={keyExtractor}
                    numColumns={7}
                    extraData={selectedDay}
                    contentContainerStyle={styles.gridContainer}
                    scrollEnabled={true}
                    showsVerticalScrollIndicator={false}
                    removeClippedSubviews={true}
                    initialNumToRender={42}
                    maxToRenderPerBatch={42}
                    windowSize={3}
                    ListEmptyComponent={
                        <View style={styles.centeredContainer}>
                            <Icon name="calendar-outline" size={48} color={COLORS.grayText} />
                            <Text style={styles.emptyText}>No attendance data available</Text>
                        </View>
                    }
                />
            )}

            {/* Detail Modal */}
            <AttendanceDetailModal
                visible={detailModalVisible}
                onClose={() => {
                    setDetailModalVisible(false);
                    const todayItem = calendarGrid.find(i => i.isToday);
                    if (todayItem) setSelectedDay(todayItem);
                }}
                selectedDay={selectedDay}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                userId={userId}
                onWithdrawSuccess={() => {
                    setDetailModalVisible(false);
                    loadData();
                }}
            />

            {/* Regularization Edit Modal (opened from grid edit icon) */}
            <RegularizationEditModal
                visible={editModalVisible}
                onClose={closeEditModal}
                date={editDate}
                userId={userId}
                headerLabel={editHeaderLabel}
                onSubmitSuccess={() => {
                    closeEditModal();
                    loadData(); // Refresh the grid data after successful submission
                }}
            />

        </SafeAreaView>
    );
};

// ─────────── Styles ───────────
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#3E699B',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuButton: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 18,
        color: '#fff',
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },

    // Month navigation
    monthNav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: COLORS.bg,
        marginHorizontal: 16,
        marginTop: 5,
        borderRadius: 12,
        ...SHADOW,
    },
    navButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#f0f4ff',
    },
    monthLabel: {
        fontSize: 17,
        fontWeight: '700',
        color: COLORS.primary,
    },

    // Legend
    legendContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        gap: 4,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 8,
        marginBottom: 4,
    },
    legendBox: {
        width: 12,
        height: 12,
        borderRadius: 3,
        borderWidth: 1,
        marginRight: 6,
    },
    legendWarningIcon: {
        fontSize: 12,
        marginRight: 4,
    },
    legendText: {
        fontSize: 11,
        color: COLORS.darkText,
        fontWeight: '500',
        marginL: 4,
    },
    legendsText: {
        fontSize: 12,
        color: COLORS.darkText,
        fontWeight: '500',
        marginLeft: 4,
    },

    // Day headers
    dayHeaderRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginBottom: 4,
    },
    dayHeaderCell: {
        width: CELL_SIZE,
        margin: CELL_MARGIN,
        alignItems: 'center',
        paddingVertical: 6,
    },
    dayHeaderText: {
        fontSize: 11,
        fontWeight: '700',
        color: COLORS.grayText,
        textTransform: 'uppercase',
    },

    // Grid
    gridContainer: {
        paddingHorizontal: 16,
        paddingBottom: 20,
        backgroundColor: COLORS.bg,
    },
    emptyCellPlaceholder: {
        width: CELL_SIZE,
        height: CELL_HEIGHT,
        margin: CELL_MARGIN,
    },

    // States
    centeredContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: COLORS.grayText,
    },
    errorText: {
        marginTop: 12,
        fontSize: 15,
        color: COLORS.grayText,
        textAlign: 'center',
    },
    retryButton: {
        marginTop: 16,
        backgroundColor: COLORS.blue,
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    emptyText: {
        marginTop: 12,
        fontSize: 14,
        color: COLORS.grayText,
    },
    regularizationIconWrap: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#FFE8D1',
        alignItems: 'center',
        justifyContent: 'center',
    },
    regularizationText: {
        color: '#e65100',
        fontSize: 11,
        fontWeight: 'bold',
    },
});

export default AttendanceGridScreen;