import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../utils/theme';
import useLeaveStore from '../../store/useLeaveStore';
import AuthService from '../../services/AuthService';

const parseNumber = (val) => {
    if (typeof val === 'string' && val.includes('hrs')) {
        const [hours, mins] = val.replace('hrs', '').split(':');
        return parseInt(hours, 10) + parseInt(mins, 10) / 60;
    }
    return parseFloat(val) || 0;
};

// Pure SVG Pie Chart component — 3 slices: Requested (yellow), Used (red), Balance (blue)
const SimplePie = ({ requested, used, balance, total, grayOnly }) => {
    const r = 20;
    const strokeW = 40;
    const size = r * 2 + strokeW; // 80
    const c = size / 2;

    if (grayOnly || total === 0) {
        return (
            <Svg width={size} height={size}>
                <Circle cx={c} cy={c} r={size / 2} fill={COLORS.grayBg} />
            </Svg>
        );
    }

    const circ = 2 * Math.PI * r;

    // Build slices: each slice starts where the previous ended
    // Slice order: Balance (base), then Used on top, then Requested on top
    const requestedRatio = requested / total;
    const usedRatio = used / total;

    const requestedDash = requestedRatio * circ;
    const usedDash = usedRatio * circ;

    return (
        <Svg width={size} height={size}>
            <G rotation="-90" origin={`${c}, ${c}`}>
                {/* Base: Balance (Blue) fills entire circle */}
                <Circle cx={c} cy={c} r={r} fill="transparent" stroke={COLORS.blue} strokeWidth={strokeW} />
                {/* Used slice (Red/Orange) — rendered on top of balance */}
                {used > 0 && (
                    <Circle
                        cx={c} cy={c} r={r}
                        fill="transparent"
                        stroke={COLORS.red || '#ef4444'}
                        strokeWidth={strokeW}
                        strokeDasharray={`${usedDash} ${circ}`}
                        strokeDashoffset={-requestedDash}
                    />
                )}
                {/* Requested slice (Yellow/Orange) — first slice from top */}
                {requested > 0 && (
                    <Circle
                        cx={c} cy={c} r={r}
                        fill="transparent"
                        stroke={COLORS.yellow || '#f59e0b'}
                        strokeWidth={strokeW}
                        strokeDasharray={`${requestedDash} ${circ}`}
                    />
                )}
            </G>
        </Svg>
    );
};

const LeaveCard = ({ item, navigation }) => {
    const requestedVal = parseNumber(item.requested || '0');
    const usedVal = parseNumber(item.used || '0') + parseNumber(item.approved || '0');
    const balanceVal = parseNumber(item.balance || '0');
    const totalVal = requestedVal + usedVal + balanceVal;

    const isLossOfPay = item.title === 'Loss Of Pay';
    const isBereavement = item.title === 'Bereavement Leave';

    // Decide if chart is pure gray
    const grayOnly = totalVal === 0;

    return (
        <View style={styles.cardContainer}>
            <Text style={[styles.cardTitle, { color: item.titleColor }]}>
                {item.title}
            </Text>

            <View style={styles.chartWrapper}>
                <SimplePie requested={requestedVal} used={usedVal} balance={balanceVal} total={totalVal} grayOnly={grayOnly} />
            </View>

            <View style={styles.statsGrid}>
                {/* ROW 1: Requested & Approved/Used for special cases, or Total & Requested for standard */}
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: isLossOfPay || isBereavement ? COLORS.orange : '#6fa8dc' }]} numberOfLines={1}>
                            {isLossOfPay || isBereavement ? item.requested : item.total}
                        </Text>
                        <Text style={styles.statLabel}>
                            {isLossOfPay || isBereavement ? 'Requested' : 'Total'}
                        </Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: isLossOfPay ? COLORS.orange : isBereavement ? COLORS.orange : COLORS.yellow }]} numberOfLines={1}>
                            {isLossOfPay ? (item.approved || '0') : isBereavement ? item.used : item.requested}
                        </Text>
                        <Text style={styles.statLabel}>
                            {isLossOfPay ? 'Approved' : isBereavement ? 'Used' : 'Requested'}
                        </Text>
                    </View>
                </View>

                {/* ROW 2: Empty Placeholders for special cases, or Used & Balance for standard */}
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        {isLossOfPay || isBereavement ? (
                            <View style={styles.emptyStatPlaceholder} /> // Maintains fixed height
                        ) : (
                            <>
                                <Text style={[styles.statValue, { color: COLORS.orange }]} numberOfLines={1}>{item.used}</Text>
                                <Text style={styles.statLabel}>Used</Text>
                            </>
                        )}
                    </View>
                    <View style={styles.statItem}>
                        {isLossOfPay || isBereavement ? (
                            <View style={styles.emptyStatPlaceholder} /> // Maintains fixed height
                        ) : (
                            <>
                                <Text style={[styles.statValue, { color: COLORS.blue }]} numberOfLines={1}>{item.balance}</Text>
                                <Text style={styles.statLabel}>Balance</Text>
                            </>
                        )}
                    </View>
                </View>
            </View>

            <View style={styles.applyButtonContainer}>
                <TouchableOpacity
                    onPress={() => navigation.navigate('LeaveApply', {
                        leaveType: item.title,
                        balance: balanceVal
                    })}
                    style={styles.applyButton}
                >
                    <Text style={styles.applyButtonText}>Apply</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const LeaveRequestScreen = ({ navigation }) => {
    const { leaveBalances, loading, error, fetchLeaveBalances } = useLeaveStore();
    const [initialLoad, setInitialLoad] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = useCallback(async () => {
        try {
            const user = await AuthService.getUserInfo();
            const userId = user?.userId;
            const currentYear = new Date().getFullYear();
            if (userId) {
                await fetchLeaveBalances(userId, currentYear);
            }
        } catch (err) {
            console.error('LeaveRequest loadData error:', err);
        }
    }, [fetchLeaveBalances]);

    useEffect(() => {
        const init = async () => {
            await loadData();
            setInitialLoad(false);
        };
        init();
    }, [loadData]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const renderContent = () => {
        if (loading && initialLoad) {
            return (
                <View style={styles.centeredContainer}>
                    <ActivityIndicator size="large" color={COLORS.blue} />
                    <Text style={styles.loadingText}>Loading leave balances...</Text>
                </View>
            );
        }

        if (error && leaveBalances.length === 0) {
            return (
                <View style={styles.centeredContainer}>
                    <Icon name="alert-circle-outline" size={48} color="#d1d5db" />
                    <Text style={styles.errorText}>No leave data available</Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={async () => {
                            const user = await AuthService.getUserInfo();
                            const userId = user?.userId;
                            if (userId) {
                                fetchLeaveBalances(userId, new Date().getFullYear());
                            }
                        }}
                    >
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return (
            <FlatList
                data={leaveBalances}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <LeaveCard item={item} navigation={navigation} />}
                numColumns={2}
                contentContainerStyle={styles.flatListContent}
                columnWrapperStyle={styles.columnWrapper}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[COLORS.blue]}
                        tintColor={COLORS.blue}
                    />
                }
            />
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.menuButton}>
                        <Icon name="menu" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Leave Request</Text>
                </View>
            </View>
            {renderContent()}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.grayBg,
    },
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
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
    flatListContent: {
        padding: 8,
        paddingBottom: 40,
    },
    columnWrapper: {
        justifyContent: 'space-between',
    },
    cardContainer: {
        flex: 1,
        backgroundColor: COLORS.white,
        borderRadius: 12, // softer border radius
        margin: 8,
        padding: 16,
        alignItems: 'center', // Centers everything inside the card vertically down the middle
        elevation: 3, // shadow for android
        shadowColor: '#000', // shadow for ios
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderColor: '#e5e7eb',
        borderWidth: 1,
    },
    cardTitle: {
        textAlign: 'center',
        fontWeight: '600',
        fontSize: 14,
        marginBottom: 8,
    },
    chartWrapper: {
        width: 90,
        height: 90,
        marginVertical: 12, // Equal Margin top & bottom before the stats grid
        alignItems: 'center',
        justifyContent: 'center',
    },
    statsGrid: {
        width: '100%',
        flexDirection: 'column',
        marginVertical: 10,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10, // Adds space between the top stats and bottom stats
    },
    statItem: {
        flex: 1,
        alignItems: 'center', // align center to keep it completely balanced left and right
    },
    statValue: {
        fontSize: 13,
        fontWeight: 'bold', // slightly bolder text
        color: COLORS.darkText,
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 11,
        color: COLORS.grayText,
    },
    emptyStatPlaceholder: {
        height: 32, // Rough height of value (18) + label (14) = 32px to match other stat items.
    },
    applyButtonContainer: {
        width: '100%',
        alignItems: 'center',
        marginTop: 6,
    },
    applyButton: {
        backgroundColor: '#3e6b9c',
        paddingHorizontal: 24,
        paddingVertical: 8,
        borderRadius: 6,
    },
    applyButtonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    }
});

export default LeaveRequestScreen;
