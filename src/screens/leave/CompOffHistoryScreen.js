import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../../utils/theme';
import useCompOffStore from '../../store/useCompOffStore';
import AuthService from '../../services/AuthService';
import HistoryTabs from '../../components/leave/HistoryTabs';
import HistoryCard from '../../components/leave/HistoryCard';
import HistoryDetailsModal from '../../components/leave/HistoryDetailsModal';

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

    const {
        pendingList, historyList, selectedDetails, loading, refreshing,
        fetchPendingCompOff, fetchHistoryCompOff, fetchCompOffDetails,
        refreshPending, refreshHistory
    } = useCompOffStore();

    useEffect(() => {
        const loadPending = async () => {
            try {
                const user = await AuthService.getUserInfo();
                if (user?.userId) {
                    await fetchPendingCompOff(new Date().getFullYear());
                }
            } catch (err) {
                console.error(err);
            }
        };
        loadPending();
    }, [fetchPendingCompOff]);

    const loadHistory = useCallback(async () => {
        try {
            const user = await AuthService.getUserInfo();
            if (user?.userId) {
                const { fromDate, toDate } = getMonthRange();
                await fetchHistoryCompOff(new Date().getFullYear(), fromDate, toDate);
            }
        } catch (err) {
            console.error(err);
        }
    }, [fetchHistoryCompOff]);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        if (tab === 'History') {
            loadHistory();
        }
    };

    const onRefresh = useCallback(async () => {
        try {
            const user = await AuthService.getUserInfo();
            if (user?.userId) {
                if (activeTab === 'Pending') {
                    await refreshPending(new Date().getFullYear());
                } else {
                    const { fromDate, toDate } = getMonthRange();
                    await refreshHistory(new Date().getFullYear(), fromDate, toDate);
                }
            }
        } catch (err) {
            console.error(err);
        }
    }, [activeTab, refreshPending, refreshHistory]);

    const handleCardPress = async (item) => {
        setModalVisible(true);
        const user = await AuthService.getUserInfo();
        if (user?.userId) {
            await fetchCompOffDetails(item.id, user.userId);
        }
    };

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Icon name="folder-open-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No comp-off records found</Text>
        </View>
    );

    const currentData = activeTab === 'Pending' ? pendingList : historyList;

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

            {loading && !refreshing ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color={COLORS.blue} />
                </View>
            ) : (
                <FlatList
                    data={currentData}
                    keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                    renderItem={({ item }) => (
                        <HistoryCard
                            date={item.appliedOn || item.date}
                            startDate={item.startDate}
                            endDate={item.endDate}
                            status={item.status}
                            assignedToName={item.assignToName}
                            reviewedByName={item.reviewByName}
                            onPress={() => handleCardPress(item)}
                        />
                    )}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={renderEmpty}
                    showsVerticalScrollIndicator={false}
                    onEndReachedThreshold={0.5}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.blue]} tintColor={COLORS.blue} />
                    }
                />
            )}

            <HistoryDetailsModal
                visible={modalVisible}
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
