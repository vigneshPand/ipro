import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Icons from 'react-native-vector-icons/Feather';
import { COLORS } from '../../utils/theme';
import useHistoryFilters from '../../hooks/useHistoryFilters';
import HistoryFilters from '../../components/historyFilters/HistoryFilters';
import PendingLeaveCard from '../../components/leave/PendingLeaveCard';
import HistoryLeaveCard from '../../components/leave/HistoryLeaveCard';
import LeaveHistoryDetailsModal from '../../components/leave/LeaveHistoryDetailsModal';
import AuthService from '../../services/AuthService';
import LoadingOverlay from '../../components/LoadingOverlay';
import useTeamLeaveStore from '../../store/useTeamLeaveStore';
import { debounce } from '../../utils/Debounce';

const DEBOUNCE_MS = 400;

import { getMonthRange } from '../../utils/dateUtils';

const TeamLeaveRequestsScreen = ({ navigation }) => {
    const [activeTab, setActiveTab] = useState('Pending');
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [focusTrigger, setFocusTrigger] = useState(0);

    const userMailRef = useRef(null);
    const isInitialMount = useRef(true);

    const {
        pendingList, loadingPending, fetchPendingLeaves, fetchNextPendingPage, resetPending,
        historyList, loadingHistory, fetchHistoryLeaves, fetchNextHistoryPage, resetHistory,
        fetchLeaveDetails, selectedLeaveDetails, loadingLeaveDetails,
    } = useTeamLeaveStore();

    const {
        filters,
        updateFilters,
        buildQueryParams,
    } = useHistoryFilters();

    // ─── Get user email once ───
    const getUserMail = useCallback(async () => {
        if (userMailRef.current) return userMailRef.current;
        const user = await AuthService.getUserInfo();
        userMailRef.current = user?.mail || user?.email || null;
        return userMailRef.current;
    }, []);

    // ─── Core fetch for a specific tab ───
    const fetchDataForTab = useCallback(async (tab, keyword = '') => {
        try {
            const mail = await getUserMail();
            if (!mail) return;

            const year = new Date().getFullYear();
            const raw = buildQueryParams(null, year, keyword);
            // Remove userId – manager API uses mail instead
            const { userId, pageNo, sortBy, direction, keyword: _kw, ...extraParams } = raw;
            extraParams.keyword = keyword;

            if (tab === 'Pending') {
                await fetchPendingLeaves(mail, year, 0, extraParams);
            } else {
                const defaultRange = getMonthRange();
                const fDate = extraParams.fromDate || defaultRange.fromDate;
                const tDate = extraParams.toDate || defaultRange.toDate;
                const { fromDate, toDate, ...historyExtra } = extraParams;
                await fetchHistoryLeaves(mail, year, fDate, tDate, 0, historyExtra);
            }
        } catch (err) {
            console.error('TeamLeaveRequests fetchData error:', err);
        }
    }, [buildQueryParams, fetchPendingLeaves, fetchHistoryLeaves, getUserMail]);

    // Wrapper that uses current active tab (for search / refresh / focus)
    const fetchData = useCallback(
        (keyword = '') => fetchDataForTab(activeTab, keyword),
        [activeTab, fetchDataForTab]
    );

    // ─── Search with debounce ───
    const debouncedSearch = useRef(
        debounce((text) => {
            fetchData(text);
        }, DEBOUNCE_MS)
    ).current;

    const handleSearchChange = useCallback((text) => {
        setSearchQuery(text);
        debouncedSearch(text);
    }, [debouncedSearch]);

    // ─── Reset on screen focus ───
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            setActiveTab('Pending');
            setSearchQuery('');
            if (typeof resetPending === 'function') resetPending();
            if (typeof resetHistory === 'function') resetHistory();
            updateFilters({ fromDate: null, toDate: null, leaveTypes: [], status: [], pageNo: 0 });
            setFocusTrigger(prev => prev + 1);
        });
        return unsubscribe;
    }, [navigation, updateFilters, resetPending, resetHistory]);

    // ─── Fetch only if not triggered by search ───
    useEffect(() => {
        if (!searchQuery) {
            fetchData('');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchData, filters, focusTrigger]);

    // ─── Reset list when filters change (not on mount) ───
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        if (activeTab === 'Pending') {
            resetPending();
        } else {
            resetHistory();
        }
    }, [filters, activeTab, resetPending, resetHistory]);

    // ─── Tab switch ───
    const handleTabChange = (tab) => {
        if (tab === activeTab) return;

        setActiveTab(tab);
        setSearchQuery('');

        if (tab === 'Pending') {
            resetPending();
            updateFilters({ fromDate: null, toDate: null, leaveTypes: [], status: [], pageNo: 0 });
        } else {
            resetHistory();
            const { fromDate, toDate } = getMonthRange();
            updateFilters({ fromDate, toDate, leaveTypes: [], status: [], pageNo: 0 });
        }
        // Do NOT call fetch here; useFocusEffect + filters change
        // will trigger a single fetch for the current active tab.
    };

    // ─── Pagination (infinite scroll) ───
    const handleEndReached = useCallback(async () => {
        try {
            const mail = await getUserMail();
            if (!mail) return;

            const year = new Date().getFullYear();
            const raw = buildQueryParams(null, year, searchQuery);
            const { userId, pageNo, sortBy, direction, keyword: _kw, ...extraParams } = raw;
            extraParams.keyword = searchQuery;

            if (activeTab === 'Pending') {
                await fetchNextPendingPage(mail, year, extraParams);
            } else {
                const defaultRange = getMonthRange();
                const fDate = extraParams.fromDate || defaultRange.fromDate;
                const tDate = extraParams.toDate || defaultRange.toDate;
                const { fromDate, toDate, ...historyExtra } = extraParams;
                await fetchNextHistoryPage(mail, year, fDate, tDate, historyExtra);
            }
        } catch (err) {
            console.error('TeamLeaveRequests handleEndReached error:', err);
        }
    }, [activeTab, searchQuery, buildQueryParams, fetchNextPendingPage, fetchNextHistoryPage, getUserMail]);

    // ─── Pull-to-refresh ───
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchData(searchQuery);
        setRefreshing(false);
    }, [fetchData, searchQuery]);

    // ─── Card press → Detail Modal ───
    const handleCardPress = (item) => {
        setModalVisible(true);
        fetchLeaveDetails(item.id, item.startDate, item.endDate, item.multiApprovalNumber);
    };

    // ─── Empty state ───
    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
                <Icons name="inbox" size={48} color="#d1d5db" />
            </View>
            <Text style={styles.emptyText}>No data is available</Text>
        </View>
    );

    const isLoading = activeTab === 'Pending' ? loadingPending : loadingHistory;
    const listData = activeTab === 'Pending' ? pendingList : historyList;

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.headerRow}>
                <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.backBtn}>
                    <Icon name="menu" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerText}>Leave Requests</Text>
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

            {/* Search Input */}
            <View style={styles.searchContainer}>
                <View style={styles.searchInputWrapper}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by name..."
                        placeholderTextColor="#9ca3af"
                        value={searchQuery}
                        onChangeText={handleSearchChange}
                    />
                    {searchQuery.length > 0 ? (
                        <TouchableOpacity onPress={() => handleSearchChange('')}>
                            <Icon name="close-circle" size={20} color="#9ca3af" />
                        </TouchableOpacity>
                    ) : (
                        <Icons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
                    )}
                </View>
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

            {/* Content searching loader overlay */}
            <LoadingOverlay
                visible={isLoading && listData.length === 0 && !refreshing}
                message="Fetching requests..."
                type="loading"
            />

            <FlatList
                data={listData}
                keyExtractor={(item, index) => `${item.id}-${index}`}
                renderItem={({ item }) =>
                    activeTab === 'Pending' ? (
                        <PendingLeaveCard
                            userName={item?.userName || item?.name || ''}
                            type={item?.type || ''}
                            days={item?.noOfDays || 0}
                            status={item?.status || 'PENDING'}
                            pendingWith={item?.pendingWith || item?.assignToName || ''}
                            startDate={item?.startDate}
                            endDate={item?.endDate}
                            onPress={() => handleCardPress(item)}
                        />
                    ) : (
                        <HistoryLeaveCard
                            item={item}
                            onPress={handleCardPress}
                        />
                    )
                }
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={isLoading ? null : renderEmpty}
                showsVerticalScrollIndicator={false}
                onEndReachedThreshold={0.5}
                onEndReached={handleEndReached}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={5}
                removeClippedSubviews={true}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} tintColor={COLORS.primary} />
                }
                ListFooterComponent={
                    isLoading && listData.length > 0 ? (
                        <View style={styles.footerLoader}>
                            <ActivityIndicator size="small" color={COLORS.primary} />
                        </View>
                    ) : null
                }
            />

            {/* Details Modal (shared) */}
            <LeaveHistoryDetailsModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                showWithdraw={false}
                externalLeaveDetails={selectedLeaveDetails}
                externalLoadingDetails={loadingLeaveDetails}
                onTransferSuccess={() => fetchData(searchQuery)}
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
        backgroundColor: COLORS.primary,
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
        borderBottomColor: COLORS.primary,
    },
    tabText: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.inactiveTab,
    },
    activeTabText: {
        color: COLORS.primary,
    },
    searchContainer: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#e5e7eb',
    },
    searchInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        borderRadius: 8,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    searchInput: {
        flex: 1,
        height: 40,
        fontSize: 15,
        color: '#374151',
    },
    searchIcon: {
        marginLeft: 8,
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
    emptyIconContainer: {
        backgroundColor: '#f3f4f6',
        padding: 24,
        borderRadius: 50,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 16,
        color: COLORS.grayText,
        fontWeight: '500',
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerLoader: {
        paddingVertical: 10,
        alignItems: 'center',
    },
});

export default TeamLeaveRequestsScreen;
