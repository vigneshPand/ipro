import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import PendingLeaveCard from '../../components/leave/PendingLeaveCard';
import HistoryLeaveCard from '../../components/leave/HistoryLeaveCard';
import LeaveHistoryDetailsModal from '../../components/leave/LeaveHistoryDetailsModal';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../../utils/theme';
import useLeaveStore from '../../store/useLeaveStore';
import AuthService from '../../services/AuthService';
import useHistoryFilters from '../../hooks/useHistoryFilters';
import HistoryFilters from '../../components/historyFilters/HistoryFilters';

// Helper: get current month date range (YYYY-MM-DD)
const getMonthRange = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDate = new Date(year, month + 1, 0).getDate();
    const lastDay = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDate).padStart(2, '0')}`;
    return { fromDate: firstDay, toDate: lastDay };
};

const LeaveHistoryScreen = ({ navigation }) => {
    const [activeTab, setActiveTab] = useState('Pending');
    const [modalVisible, setModalVisible] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const {
        pendingLeaves, loadingPending, fetchPendingLeaves, fetchNextPendingPage,
        historyLeaves, historyLoading, fetchHistoryLeaves, fetchNextHistoryPage,
        fetchLeaveDetails,
    } = useLeaveStore();

    const {
        filters,
        updateFilters,
        buildQueryParams,
    } = useHistoryFilters();

    const fetchData = useCallback(async () => {
        try {
            const user = await AuthService.getUserInfo();
            if (!user?.userId) return;

            const params = buildQueryParams(user.userId, new Date().getFullYear());
            const { userId, year, pageNo, sortBy, direction, keyword, ...extraParams } = params;

            if (activeTab === 'Pending') {
                await fetchPendingLeaves(user.userId, new Date().getFullYear(), 0, extraParams);
            } else {
                const finalFromDate = extraParams.fromDate;
                const finalToDate = extraParams.toDate;
                const { fromDate, toDate, ...historyExtraParams } = extraParams;

                const defaultRange = getMonthRange();
                const fDate = finalFromDate || defaultRange.fromDate;
                const tDate = finalToDate || defaultRange.toDate;

                await fetchHistoryLeaves(user.userId, new Date().getFullYear(), fDate, tDate, 0, historyExtraParams);
            }
        } catch (err) {
            console.error(err);
        }
    }, [activeTab, buildQueryParams, fetchPendingLeaves, fetchHistoryLeaves]);

    const handleEndReached = useCallback(async () => {
        try {
            const user = await AuthService.getUserInfo();
            if (!user?.userId) return;

            const params = buildQueryParams(user.userId, new Date().getFullYear());
            const { userId, year, pageNo, sortBy, direction, keyword, ...extraParams } = params;

            if (activeTab === 'Pending') {
                await fetchNextPendingPage(user.userId, new Date().getFullYear(), extraParams);
            } else {
                const finalFromDate = extraParams.fromDate;
                const finalToDate = extraParams.toDate;
                const { fromDate, toDate, ...historyExtraParams } = extraParams;

                const defaultRange = getMonthRange();
                const fDate = finalFromDate || defaultRange.fromDate;
                const tDate = finalToDate || defaultRange.toDate;

                await fetchNextHistoryPage(user.userId, new Date().getFullYear(), fDate, tDate, historyExtraParams);
            }
        } catch (err) {
            console.error(err);
        }
    }, [activeTab, buildQueryParams, fetchNextPendingPage, fetchNextHistoryPage]);

    useFocusEffect(
        useCallback(() => {
            fetchData();
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [fetchData, filters])
    );

    const handleTabChange = (tab) => {
        if (tab === activeTab) return;
        setActiveTab(tab);
        if (tab === 'History') {
            const { fromDate, toDate } = getMonthRange();
            updateFilters({ fromDate, toDate, leaveTypes: [], status: [], pageNo: 0 });
        } else {
            updateFilters({ fromDate: null, toDate: null, leaveTypes: [], status: [], pageNo: 0 });
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    }, [fetchData]);

    const handleCardPress = (leave) => {
        setModalVisible(true);
        fetchLeaveDetails(leave.id, leave.startDate, leave.endDate);
    };

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Icon name="folder-open-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No leave records found</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.headerRow}>
                <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.backBtn}>
                    <Icon name="menu" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerText}>Leave History</Text>
                <View style={styles.headerSpacer} />
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'Pending' && styles.activeTab]}
                    onPress={() => handleTabChange('Pending')}
                >
                    <Text style={[styles.tabText, activeTab === 'Pending' && styles.activeTabText]}>Pending</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'History' && styles.activeTab]}
                    onPress={() => handleTabChange('History')}
                >
                    <Text style={[styles.tabText, activeTab === 'History' && styles.activeTabText]}>History</Text>
                </TouchableOpacity>
            </View>

            {/* Filter Bar */}
            <HistoryFilters
                filters={filters}
                onFilterChange={updateFilters}
                onResetFilters={() => {
                    if (activeTab === 'History') {
                        const { fromDate, toDate } = getMonthRange();
                        updateFilters({ fromDate, toDate, leaveTypes: [], status: [], pageNo: 0 });
                    } else {
                        updateFilters({ fromDate: null, toDate: null, leaveTypes: [], status: [], pageNo: 0 });
                    }
                }}
                defaultFromDate={activeTab === 'History' ? getMonthRange().fromDate : null}
                defaultToDate={activeTab === 'History' ? getMonthRange().toDate : null}
                showDateFilter={true}
                showLeaveTypeFilter={true}
                showStatusFilter={activeTab === 'History'}
            />

            {/* Tab Content */}
            {activeTab === 'Pending' ? (
                loadingPending && !refreshing ? (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color={COLORS.blue} />
                    </View>
                ) : (
                    <FlatList
                        data={pendingLeaves}
                        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                        renderItem={({ item }) => (
                            <PendingLeaveCard
                                type={item.type}
                                days={item.noOfDays}
                                status={item.status}
                                pendingWith={item.pendingWith || item.assignToName}
                                startDate={item.startDate}
                                endDate={item.endDate}
                                onPress={() => handleCardPress(item)}
                            />
                        )}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={renderEmpty}
                        showsVerticalScrollIndicator={false}
                        onEndReachedThreshold={0.5}
                        onEndReached={handleEndReached}
                        initialNumToRender={10}
                        maxToRenderPerBatch={10}
                        windowSize={5}
                        removeClippedSubviews={true}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.blue]} tintColor={COLORS.blue} />
                        }
                    />
                )
            ) : (
                historyLoading && !refreshing ? (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color={COLORS.blue} />
                    </View>
                ) : (
                    <FlatList
                        data={historyLeaves}
                        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                        renderItem={({ item }) => (
                            <HistoryLeaveCard
                                item={item}
                                onPress={handleCardPress}
                            />
                        )}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={renderEmpty}
                        showsVerticalScrollIndicator={false}
                        onEndReachedThreshold={0.5}
                        onEndReached={handleEndReached}
                        initialNumToRender={10}
                        maxToRenderPerBatch={10}
                        windowSize={5}
                        removeClippedSubviews={true}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.blue]} tintColor={COLORS.blue} />
                        }
                    />
                )
            )}

            {/* Details Modal (shared between Pending & History) */}
            <LeaveHistoryDetailsModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                showWithdraw={activeTab === 'Pending'}
            />

        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },
    headerRow: {
        backgroundColor: COLORS.blue,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    backBtn: {
        marginRight: 16,
    },
    headerSpacer: {
        width: 24,
    },
    headerText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingTop: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: COLORS.blue,
    },
    tabText: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.inactiveTab,
    },
    activeTabText: {
        color: COLORS.blue,
    },
    listContent: {
        padding: 16,
        paddingBottom: 40,
        flexGrow: 1,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 60,
    },
    emptyText: {
        marginTop: 12,
        fontSize: 15,
        color: COLORS.grayText,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});

export default LeaveHistoryScreen;
