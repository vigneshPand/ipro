import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../utils/theme';
import PieChart from '../../components/common/PieChart';
import useLeaveStore from '../../store/useLeaveStore';
import AuthService from '../../services/AuthService';

const parseNumber = (val) => {
    if (typeof val === 'string' && val.includes('hrs')) {
        const [hours, mins] = val.replace('hrs', '').split(':');
        return parseInt(hours, 10) + parseInt(mins, 10) / 60;
    }
    return parseFloat(val) || 0;
};

// Extracted SimplePie logic to components/common/PieChart

const LeaveCard = ({ item, navigation }) => {
    const requestedVal = parseNumber(item.requested || '0');
    const usedVal = parseNumber(item.used || '0') + parseNumber(item.approved || '0');
    const itemBalance = item.balance !== undefined ? item.balance : item.remaining;
    const balanceVal = parseNumber(itemBalance || '0');
    const totalVal = requestedVal + usedVal + balanceVal;

    const CHART_COLORS = {
        requested: '#f59e0b',
        used: '#ef4444',
        total: item.titleColor || '#3b82f6',
        balance: '#3b82f6',
        empty: '#e5e7eb'
    };

    const isLossOfPay = item.title === 'Loss Of Pay';
    const isBereavement = item.title === 'Bereavement Leave';
    const isPaternityLeave = item.title === 'Paternity Leave';
    const isSpecialCase = isLossOfPay || isBereavement || isPaternityLeave;

    return (
        <View style={styles.cardContainer}>
            <Text style={[styles.cardTitle, { color: item.titleColor }]}>
                {item.title}
            </Text>

            <View style={styles.chartWrapper}>
                <PieChart
                    total={totalVal}
                    radius={20}
                    strokeWidth={40}
                    emptyColor={CHART_COLORS.empty}
                    slices={[
                        { value: totalVal, isBase: true, color: CHART_COLORS.balance }, // Balance Base
                        { value: requestedVal, color: CHART_COLORS.requested },         // Requested first
                        { value: usedVal, color: CHART_COLORS.used }                  // Used next
                    ]}
                />
            </View>

            <View style={styles.statsGrid}>
                {/* ROW 1: Requested & Used for special cases, or Total & Requested for standard */}
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: isSpecialCase ? CHART_COLORS.requested : CHART_COLORS.total }]} numberOfLines={1}>
                            {isSpecialCase ? item.requested : item.total}
                        </Text>
                        <Text style={styles.statLabel}>
                            {isSpecialCase ? 'Requested' : 'Total'}
                        </Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: isLossOfPay ? CHART_COLORS.balance : isSpecialCase ? CHART_COLORS.used : CHART_COLORS.requested }]} numberOfLines={1}>
                            {isLossOfPay ? (item.approved || item.used || '0') : isSpecialCase ? item.used : item.requested}
                        </Text>
                        <Text style={styles.statLabel}>
                            {isLossOfPay ? 'Approved' : isSpecialCase ? 'Used' : 'Requested'}
                        </Text>
                    </View>
                </View>

                {/* ROW 2: Empty Placeholders for special cases, or Used & Balance for standard */}
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        {isSpecialCase ? (
                            <View style={styles.emptyStatPlaceholder} /> // Maintains fixed height
                        ) : (
                            <>
                                <Text style={[styles.statValue, { color: CHART_COLORS.used }]} numberOfLines={1}>{item.used}</Text>
                                <Text style={styles.statLabel}>Used</Text>
                            </>
                        )}
                    </View>
                    <View style={styles.statItem}>
                        {isSpecialCase ? (
                            <View style={styles.emptyStatPlaceholder} /> // Maintains fixed height
                        ) : (
                            <>
                                <Text style={[styles.statValue, { color: CHART_COLORS.balance }]} numberOfLines={1}>{itemBalance}</Text>
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
                        balance: isPaternityLeave ? 5 : balanceVal
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

    const LeaveRequestBalance = leaveBalances.filter((item) => item?.title !== "Work From Home");

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
                data={LeaveRequestBalance}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <LeaveCard item={item} navigation={navigation} />}
                numColumns={2}
                contentContainerStyle={styles.flatListContent}
                columnWrapperStyle={styles.columnWrapper}
                showsVerticalScrollIndicator={false}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={5}
                removeClippedSubviews={true}
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

const { width } = Dimensions.get('window');
const CARD_MARGIN = 8;
const PADDING_HORIZONTAL = 8;
const COLUMN_WIDTH = (width - PADDING_HORIZONTAL * 2 - CARD_MARGIN * 4) / 2;

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
        width: COLUMN_WIDTH,
        backgroundColor: COLORS.white,
        borderRadius: 12, // softer border radius
        margin: CARD_MARGIN,
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
