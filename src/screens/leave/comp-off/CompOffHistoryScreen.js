import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../../../utils/theme';
import useCompOffStore from '../../../store/useCompOffStore';
import AuthService from '../../../services/AuthService';
import HistoryTabs from '../../../components/leave/HistoryTabs';
import PendingCompOffCard from './PendingCompOffCard';
import HistoryCompOffCard from './HistoryCompOffCard';
import CompOffDetailsModal from './CompOffDetailsModal';
import useHistoryFilters from '../../../hooks/useHistoryFilters';
import HistoryFilters from '../../../components/historyFilters/HistoryFilters';

const getMonthRange = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDate = new Date(year, month + 1, 0).getDate();
    const lastDay = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDate).padStart(2, '0')}`;
    return { fromDate: firstDay, toDate: lastDay };
};

const CompOffHistoryScreen = ({ navigation }) => {
    const [activeTab, setActiveTab] = useState('Pending');
    const [modalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState('Pending');

    const {
        pendingList, historyList, selectedDetails, pendingLoading, historyLoading, refreshing,
        fetchPendingCompOff, fetchHistoryCompOff, fetchCompOffDetails,
        fetchNextPendingPage, fetchNextHistoryPage,
        refreshPending, refreshHistory
    } = useCompOffStore();

    const {
        filters,
        updateFilters,
    } = useHistoryFilters();

    // Build extra params for Pending tab (fromDate/toDate)
    const buildPendingExtra = useCallback(() => {
        const extra = {};
        if (filters.fromDate) extra.fromDate = filters.fromDate;
        if (filters.toDate) extra.toDate = filters.toDate;
        return extra;
    }, [filters.fromDate, filters.toDate]);

    // Build extra params for History tab (startDate/endDate/statuses)
    const buildHistoryExtra = useCallback(() => {
        const extra = {};
        if (filters.status && filters.status.length > 0) {
            extra.statuses = filters.status.join(',');
        }
        return extra;
    }, [filters.status]);

    // Unified fetch
    const fetchData = useCallback(async () => {
        try {
            const user = await AuthService.getUserInfo();
            if (!user?.userId) return;
            const year = new Date().getFullYear();

            if (activeTab === 'Pending') {
                await fetchPendingCompOff(year, 0, buildPendingExtra());
            } else {
                const defaultRange = getMonthRange();
                const startDate = filters.fromDate || defaultRange.fromDate;
                const endDate = filters.toDate || defaultRange.toDate;
                await fetchHistoryCompOff(year, startDate, endDate, 0, buildHistoryExtra());
            }
        } catch (err) {
            console.error(err);
        }
    }, [activeTab, filters, buildPendingExtra, buildHistoryExtra, fetchPendingCompOff, fetchHistoryCompOff]);

    const handleEndReached = useCallback(async () => {
        try {
            const year = new Date().getFullYear();

            if (activeTab === 'Pending') {
                await fetchNextPendingPage(year, buildPendingExtra());
            } else {
                const defaultRange = getMonthRange();
                const startDate = filters.fromDate || defaultRange.fromDate;
                const endDate = filters.toDate || defaultRange.toDate;
                await fetchNextHistoryPage(year, startDate, endDate, buildHistoryExtra());
            }
        } catch (err) {
            console.error(err);
        }
    }, [activeTab, filters, buildPendingExtra, buildHistoryExtra, fetchNextPendingPage, fetchNextHistoryPage]);

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [fetchData])
    );

    const handleTabChange = (tab) => {
        if (tab === activeTab) return;
        setActiveTab(tab);
        if (tab === 'History') {
            const { fromDate, toDate } = getMonthRange();
            updateFilters({ fromDate, toDate, status: [], pageNo: 0 });
        } else {
            updateFilters({ fromDate: null, toDate: null, status: [], pageNo: 0 });
        }
    };

    const onRefresh = useCallback(async () => {
        try {
            const user = await AuthService.getUserInfo();
            if (!user?.userId) return;
            const year = new Date().getFullYear();

            if (activeTab === 'Pending') {
                await refreshPending(year, buildPendingExtra());
            } else {
                const defaultRange = getMonthRange();
                const startDate = filters.fromDate || defaultRange.fromDate;
                const endDate = filters.toDate || defaultRange.toDate;
                await refreshHistory(year, startDate, endDate, buildHistoryExtra());
            }
        } catch (err) {
            console.error(err);
        }
    }, [activeTab, filters, buildPendingExtra, buildHistoryExtra, refreshPending, refreshHistory]);

    const handleCardPress = async (item, type) => {
        setModalVisible(true);
        setModalType(type);
        const user = await AuthService.getUserInfo();
        if (user?.userId) {
            const itemId = item.id || item.requestId || item.compOffGrantId || item.compOffId || item.grantId || item.compOffGrantRequestId;
            await fetchCompOffDetails(itemId, user.userId);
        }
    };

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Icon name="folder-open-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No comp-off records found</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerRow}>
                <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.backBtn}>
                    <Icon name="menu" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerText}>Comp-Off History</Text>
                <View style={styles.headerSpacer} />
            </View>

            <HistoryTabs activeTab={activeTab} onTabChange={handleTabChange} />

            {/* Filter Bar */}
            <HistoryFilters
                filters={filters}
                onFilterChange={updateFilters}
                onResetFilters={() => {
                    if (activeTab === 'History') {
                        const { fromDate, toDate } = getMonthRange();
                        updateFilters({ fromDate, toDate, status: [], pageNo: 0 });
                    } else {
                        updateFilters({ fromDate: null, toDate: null, status: [], pageNo: 0 });
                    }
                }}
                defaultFromDate={activeTab === 'History' ? getMonthRange().fromDate : null}
                defaultToDate={activeTab === 'History' ? getMonthRange().toDate : null}
                showDateFilter={true}
                showLeaveTypeFilter={false}
                showStatusFilter={activeTab === 'History'}
            />

            {/* Tab Content */}
            {activeTab === 'Pending' ? (
                pendingLoading && !refreshing ? (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color={COLORS.blue} />
                    </View>
                ) : (
                    <FlatList
                        data={pendingList}
                        keyExtractor={(item) => (item.id || item.requestId || item.compOffGrantId || item.compOffId || Math.random()).toString()}
                        renderItem={({ item }) => (
                            <PendingCompOffCard
                                item={item}
                                onPress={() => handleCardPress(item, 'pending')}
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
                        data={historyList}
                        keyExtractor={(item) => (item.id || item.requestId || item.compOffGrantId || item.compOffId || Math.random()).toString()}
                        renderItem={({ item }) => (
                            <HistoryCompOffCard
                                item={item}
                                onPress={() => handleCardPress(item, 'history')}
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

            <CompOffDetailsModal
                visible={modalVisible}
                type={modalType}
                onClose={() => setModalVisible(false)}
                detailsData={selectedDetails}
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

export default CompOffHistoryScreen;
