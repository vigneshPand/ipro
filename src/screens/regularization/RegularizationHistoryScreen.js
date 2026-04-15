import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { COLORS } from '../../utils/theme';
import { getMonthRange } from '../../utils/dateUtils';
import AuthService from '../../services/AuthService';
import useHistoryFilters from '../../hooks/useHistoryFilters';
import HistoryFilters from '../../components/historyFilters/HistoryFilters';
import useRegularizationHistoryStore from '../../store/useRegularizationHistoryStore';
import RegularizationListCard, {
    RegularizationHistoryCard,
} from '../../components/regularization/RegularizationListCard';
import RegularizationDetailsModal from '../../components/regularization/RegularizationDetailsModal';


const RegularizationHistoryScreen = ({ navigation }) => {
    const [activeTab, setActiveTab] = useState('Pending');
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [focusTrigger, setFocusTrigger] = useState(0);

    const {
        // lists
        pendingList,
        loadingPending,
        fetchPendingList,
        fetchNextPendingPage,
        historyList,
        loadingHistory,
        fetchHistoryList,
        fetchNextHistoryPage,
        // details
        selectedItem,
        fetchDetails,
        // helpers
        setSelectedItem,
        resetForTabSwitch,
        resetPending,
        resetHistory,
    } = useRegularizationHistoryStore();

    const {
        filters,
        updateFilters,
        buildQueryParams,
    } = useHistoryFilters();

    // ── Fetch data based on active tab + filters ─────────────────────────────
    const fetchData = useCallback(async () => {
        try {
            const user = await AuthService.getUserInfo();
            if (!user?.userId) return;

            const params = buildQueryParams(user.userId, new Date().getFullYear());
            const { userId, year, pageNo, sortBy, direction, keyword, ...extraParams } = params;

            if (activeTab === 'Pending') {
                await fetchPendingList(user.userId, new Date().getFullYear(), 0, extraParams);
            } else {
                const finalFromDate = extraParams.fromDate;
                const finalToDate = extraParams.toDate;
                const { fromDate, toDate, ...historyExtraParams } = extraParams;

                const defaultRange = getMonthRange();
                const fDate = finalFromDate || defaultRange.fromDate;
                const tDate = finalToDate || defaultRange.toDate;

                await fetchHistoryList(
                    user.userId,
                    new Date().getFullYear(),
                    fDate,
                    tDate,
                    0,
                    historyExtraParams,
                );
            }
        } catch (err) {
            // Silent catch
        }
    }, [activeTab, buildQueryParams, fetchPendingList, fetchHistoryList]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            setActiveTab('Pending');
            if (typeof resetForTabSwitch === 'function') resetForTabSwitch();
            if (typeof resetPending === 'function') resetPending();
            if (typeof resetHistory === 'function') resetHistory();
            updateFilters({ fromDate: null, toDate: null, status: [], pageNo: 0 });
            setFocusTrigger(prev => prev + 1);
        });
        return unsubscribe;
    }, [navigation, updateFilters, resetForTabSwitch, resetPending, resetHistory]);

    // Fetch when tab, filters, or focus changes
    useEffect(() => {
        fetchData();
    }, [fetchData, filters, focusTrigger]);

    // ── Pull-to-refresh ───────────────────────────────────────────────────────
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    }, [fetchData]);

    // ── Tab switch ────────────────────────────────────────────────────────────
    const handleTabChange = (tab) => {
        if (tab === activeTab) return;
        setActiveTab(tab);
        resetForTabSwitch();
        if (tab === 'Pending') {
            if (typeof resetPending === 'function') resetPending();
            updateFilters({ fromDate: null, toDate: null, status: [], pageNo: 0 });
        } else {
            if (typeof resetHistory === 'function') resetHistory();
            const { fromDate, toDate } = getMonthRange();
            updateFilters({ fromDate, toDate, status: [], pageNo: 0 });
        }
    };


    // ── Card press → fetch details ────────────────────────────────────────────
    const handleCardPress = useCallback((item) => {
        setSelectedItem(item);
        fetchDetails(item.requestId);
        setModalVisible(true);
    }, [setSelectedItem, fetchDetails]);

    // ── Pagination ────────────────────────────────────────────────────────────
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

                await fetchNextHistoryPage(
                    user.userId,
                    new Date().getFullYear(),
                    fDate,
                    tDate,
                    historyExtraParams,
                );
            }
        } catch (err) {
            // Silent catch
        }
    }, [activeTab, buildQueryParams, fetchNextPendingPage, fetchNextHistoryPage]);

    // ── Withdraw success callback ──────────────────────────────────────────────
    const handleWithdrawSuccess = useCallback(async () => {
        try {
            const user = await AuthService.getUserInfo();
            if (user?.userId) {
                resetForTabSwitch();
                await fetchPendingList(user.userId, new Date().getFullYear(), 0);
            }
        } catch (err) {
            // Silent catch
        }
    }, [fetchPendingList, resetForTabSwitch]);

    // ── Empty state ───────────────────────────────────────────────────────────
    const renderEmpty = useCallback(() => (
        <View style={styles.emptyContainer}>
            <Icon name="folder-open-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No regularization records found</Text>
        </View>
    ), []);

    // ── List renderers ────────────────────────────────────────────────────────
    const renderPendingItem = useCallback(({ item }) => (
        <RegularizationListCard
            item={item}
            onPress={handleCardPress}
            isSelected={selectedItem?.requestId === item.requestId}
        />
    ), [handleCardPress, selectedItem]);

    const renderHistoryItem = useCallback(({ item }) => (
        <RegularizationHistoryCard
            item={item}
            onPress={handleCardPress}
            isSelected={selectedItem?.requestId === item.requestId}
        />
    ), [handleCardPress, selectedItem]);

    const isLoadingActive = activeTab === 'Pending' ? loadingPending : loadingHistory;
    const listData = activeTab === 'Pending' ? pendingList : historyList;
    const renderItem = activeTab === 'Pending' ? renderPendingItem : renderHistoryItem;

    return (
        <SafeAreaView style={styles.container}>

            {/* ── Header ── */}
            <View style={styles.headerRow}>
                <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.backBtn}>
                    <Icon name="menu" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerText}>Regularization</Text>
                <View style={styles.headerSpacer} />
            </View>

            {/* ── Tabs ── */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'Pending' && styles.activeTab]}
                    onPress={() => handleTabChange('Pending')}
                >
                    <Text style={[styles.tabText, activeTab === 'Pending' && styles.activeTabText]}>
                        Pending
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'History' && styles.activeTab]}
                    onPress={() => handleTabChange('History')}
                >
                    <Text style={[styles.tabText, activeTab === 'History' && styles.activeTabText]}>
                        History
                    </Text>
                </TouchableOpacity>
            </View>

            {/* ── Filters ── */}
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

            {/* ── List Body ── */}
            <View style={styles.listContainer}>
                {isLoadingActive && !refreshing ? (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color={COLORS.blue} />
                    </View>
                ) : (
                    <FlatList
                        data={listData}
                        keyExtractor={(item) =>
                            item.requestId?.toString() || Math.random().toString()
                        }
                        renderItem={renderItem}
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
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                colors={[COLORS.blue]}
                                tintColor={COLORS.blue}
                            />
                        }
                    />
                )}
            </View>

            {/* ── Details Modal ── */}
            <RegularizationDetailsModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                showWithdraw={activeTab === 'Pending'}
                onWithdrawSuccess={handleWithdrawSuccess}
            />

        </SafeAreaView>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },

    // Header
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
        flex: 1,
    },

    // Tabs
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

    // List Container
    listContainer: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    listContent: {
        padding: 16,
        paddingBottom: 40,
        flexGrow: 1,
    },

    // Empty / Loader
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 60,
    },
    emptyText: {
        marginTop: 12,
        fontSize: 13,
        color: COLORS.grayText,
        textAlign: 'center',
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default RegularizationHistoryScreen;
