/**
 * TeamRegularizationScreen
 * ─────────────────────────────────────────────────────────────────────
 * Manager (Team) flow for Regularization approvals.
 *
 * Tabs     : Pending (default) | History
 * Features : Search (debounced), Date-range filter, Pagination,
 *            Detail Modal with Approve / Reject / Previous Entries
 *
 * Pattern  : Mirrors TeamLeaveRequestsScreen exactly.
 * Isolation: Uses useTeamRegularizationStore – does NOT touch the
 *            employee-flow useRegularizationHistoryStore.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { debounce } from '../../utils/Debounce';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    TextInput,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Icons from 'react-native-vector-icons/Feather';

import { COLORS } from '../../utils/theme';
import AuthService from '../../services/AuthService';
import useHistoryFilters from '../../hooks/useHistoryFilters';
import HistoryFilters from '../../components/historyFilters/HistoryFilters';
import LoadingOverlay from '../../components/LoadingOverlay';
import TeamRequestCard from '../../components/teamRequest/TeamRequestCard';
import TeamRegularizationModal from '../../components/teamRequest/TeamRegularizationModal';
import useTeamRegularizationStore from '../../store/useTeamRegularizationStore';
import { getMonthRange } from '../../utils/dateUtils';

// ─── Constants ────────────────────────────────────────────────────────────────

const DEBOUNCE_MS = 400;

// ─── Screen ───────────────────────────────────────────────────────────────────

const TeamRegularizationScreen = ({ navigation }) => {

    const [activeTab, setActiveTab] = useState('Pending');
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [managerUserId, setManagerUserId] = useState(null);

    const isInitialMount = useRef(true);

    // ── Store ──
    const {
        pendingList, loadingPending, fetchPendingList, fetchNextPendingPage, resetPending,
        historyList, loadingHistory, fetchHistoryList, fetchNextHistoryPage, resetHistory,
        fetchDetails, setSelectedItem, resetForTabSwitch,
    } = useTeamRegularizationStore();

    const { filters, updateFilters, buildQueryParams } = useHistoryFilters();

    // ── Resolve managerUserId from user info ──
    const resolveManagerUserId = useCallback(async () => {
        if (managerUserId) return managerUserId;
        const user = await AuthService.getUserInfo();
        const id = user?.userId || null;
        setManagerUserId(id);
        return id;
    }, [managerUserId]);

    // ── Unified Fetching logic ──
    const performFetch = useCallback(async (tab, keyword, currentFilters) => {
        try {
            const mgrId = await resolveManagerUserId();
            if (!mgrId) return;

            const year = new Date().getFullYear();
            const raw = buildQueryParams(null, year, keyword);
            // buildQueryParams might use common status filter names, let's extract them
            const { userId, pageNo, sortBy, direction, keyword: _kw, ...extra } = raw;
            extra.keyword = keyword;

            if (tab === 'Pending') {
                await fetchPendingList(mgrId, year, 0, extra);
            } else {
                const def = getMonthRange();
                const fDate = extra.fromDate || def.fromDate;
                const tDate = extra.toDate || def.toDate;
                const { fromDate, toDate, ...histExtra } = extra;
                await fetchHistoryList(mgrId, year, fDate, tDate, 0, histExtra);
            }
        } catch (err) {
            console.error('TeamRegularization performFetch error:', err);
        }
    }, [buildQueryParams, fetchPendingList, fetchHistoryList, resolveManagerUserId]);

    // ─── Search with debounce ───
    const debouncedSearch = useRef(
        debounce((text) => {
            performFetch(activeTab, text, filters);
        }, DEBOUNCE_MS)
    ).current;

    const handleSearchChange = useCallback((text) => {
        setSearchQuery(text);
        debouncedSearch(text);
    }, [debouncedSearch]);

    // ── Trigger fetch on mount and tab change ──
    // Only trigger when activeTab changes OR managerUserId is set
    useEffect(() => {
        // Initial load: When managerUserId is set, fetch initial 'Pending' tab
        if (isInitialMount.current && managerUserId) {
            isInitialMount.current = false;
            performFetch(activeTab, searchQuery, filters);
            return;
        }
        // Tab change: Trigger fetch when tab changes
        if (!isInitialMount.current) {
            performFetch(activeTab, searchQuery, filters);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, managerUserId, filters]);

    useEffect(() => () => {
        // Cleanup if needed
    }, []);

    // ── Tab switch ──
    const handleTabChange = (tab) => {
        if (tab === activeTab) return;
        setActiveTab(tab);
        setSearchQuery('');
        resetForTabSwitch();

        // Reset results containers immediately for better UX
        if (tab === 'Pending') {
            resetPending();
            updateFilters({ fromDate: null, toDate: null, leaveTypes: [], status: [], pageNo: 0 });
        } else {
            resetHistory();
            const { fromDate, toDate } = getMonthRange();
            updateFilters({ fromDate, toDate, leaveTypes: [], status: [], pageNo: 0 });
        }
        // performFetch will be called automatically via useEffect when activeTab changes
    };

    // ── Pagination ──
    const handleEndReached = useCallback(async () => {
        try {
            const mgrId = await resolveManagerUserId();
            if (!mgrId) return;
            const year = new Date().getFullYear();
            const raw = buildQueryParams(null, year, searchQuery);
            const { userId, pageNo, sortBy, direction, keyword: _kw, ...extra } = raw;
            extra.keyword = searchQuery;

            if (activeTab === 'Pending') {
                await fetchNextPendingPage(mgrId, year, extra);
            } else {
                const def = getMonthRange();
                const fDate = extra.fromDate || def.fromDate;
                const tDate = extra.toDate || def.toDate;
                const { fromDate, toDate, ...histExtra } = extra;
                await fetchNextHistoryPage(mgrId, year, fDate, tDate, histExtra);
            }
        } catch (err) {
            console.error('TeamRegularization handleEndReached error:', err);
        }
    }, [activeTab, searchQuery, buildQueryParams, fetchNextPendingPage, fetchNextHistoryPage, resolveManagerUserId]);

    // ── Pull-to-refresh ──
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await performFetch(activeTab, searchQuery, filters);
        setRefreshing(false);
    }, [activeTab, performFetch, searchQuery, filters]);

    // ── Card press → open modal ──
    const handleCardPress = useCallback((item) => {
        setSelectedItem(item);
        fetchDetails(item.requestId);
        setModalVisible(true);
    }, [setSelectedItem, fetchDetails]);

    // ── Action success → refresh list ──
    const handleActionSuccess = useCallback(() => {
        performFetch(activeTab, searchQuery, filters);
    }, [activeTab, performFetch, searchQuery, filters]);

    // ── Empty state ──
    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrap}>
                <Icons name="inbox" size={48} color="#d1d5db" />
            </View>
            <Text style={styles.emptyText}>No records found</Text>
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
                <Text style={styles.headerText}>Regularization</Text>
                <View style={styles.headerSpacer} />
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
                {['Pending', 'History'].map(tab => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tabButton, activeTab === tab && styles.activeTab]}
                        onPress={() => handleTabChange(tab)}
                    >
                        <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                            {tab}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Search */}
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
                        <Icons name="search" size={20} color="#9ca3af" />
                    )}
                </View>
            </View>

            {/* Filters – date range only */}
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
                showLeaveTypeFilter={false}
                showStatusFilter={activeTab === 'History'}
            />

            {/* Loading overlay (first load) */}
            <LoadingOverlay
                visible={isLoading && listData.length === 0 && !refreshing}
                message="Fetching requests..."
                type="loading"
            />

            {/* List */}
            <FlatList
                data={listData}
                keyExtractor={(item, idx) => `${item.requestId}-${idx}`}
                renderItem={({ item }) => (
                    <TeamRequestCard
                        item={item}
                        onPress={handleCardPress}
                        type="regularization"
                        isHistory={activeTab === 'History'}
                    />
                )}
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
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[COLORS.primary]}
                        tintColor={COLORS.primary}
                    />
                }
                ListFooterComponent={
                    isLoading && listData.length > 0 ? (
                        <View style={styles.footerLoader}>
                            <ActivityIndicator size="small" color={COLORS.primary} />
                        </View>
                    ) : null
                }
            />

            {/* Detail Modal */}
            <TeamRegularizationModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                store={useTeamRegularizationStore}
                managerUserId={managerUserId}
                isPending={activeTab === 'Pending'}
                onActionSuccess={handleActionSuccess}
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
    headerRow: {
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    backBtn: { marginRight: 16 },
    headerSpacer: { width: 24 },
    headerText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 0.5,
        flex: 1,
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
    activeTab: { borderBottomColor: COLORS.primary },
    tabText: { fontSize: 15, fontWeight: '600', color: COLORS.inactiveTab },
    activeTabText: { color: COLORS.primary },
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
    emptyIconWrap: {
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
    footerLoader: {
        paddingVertical: 10,
        alignItems: 'center',
    },
});

export default TeamRegularizationScreen;
