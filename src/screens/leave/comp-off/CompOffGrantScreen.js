import React, { useEffect, useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../../utils/theme';
import useCompOffStore from '../../../store/useCompOffStore';
import PieChart from '../../../components/common/PieChart';

// Extracted PieChart logic to components/common/PieChart

const CompOffGrantScreen = ({ navigation }) => {
    const { overview, overviewLoading, fetchCompOffOverview } = useCompOffStore();
    const [refreshing, setRefreshing] = useState(false);

    const loadData = useCallback(async () => {
        await fetchCompOffOverview();
    }, [fetchCompOffOverview]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const total = overview?.total || 0;
    const available = overview?.available || 0;
    const requested = overview?.requested || 0;
    const expired = overview?.expired || 0;

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.menuButton}>
                        <Icon name="menu" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Comp-Off Grant Request</Text>
                </View>
            </View>

            {overviewLoading && !overview ? (
                <View style={styles.centeredContainer}>
                    <ActivityIndicator size="large" color={COLORS.blue} />
                    <Text style={styles.loadingText}>Loading overview...</Text>
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.blue]} tintColor={COLORS.blue} />
                    }
                >
                    <View style={styles.card}>
                        <View style={styles.cardRow}>
                            {/* Pie Chart */}
                            <View style={styles.chartWrapper}>
                                <PieChart
                                    total={total}
                                    slices={[
                                        { value: total, isBase: true, color: COLORS.yellow }, // Expired base
                                        { value: available, color: COLORS.blue },
                                        { value: requested, color: COLORS.orange }
                                    ]}
                                />
                            </View>

                            {/* Stats */}
                            <View style={styles.statsSection}>
                                <Text style={styles.cardTitle}>Comp-Off Grant Request</Text>

                                <View style={styles.statRow}>
                                    <Text style={[styles.statValue, styles.totalValue]}>{total}</Text>
                                    <Text style={styles.statLabel}>Total</Text>
                                </View>
                                <View style={styles.statRow}>
                                    <Text style={[styles.statValue, styles.availableValue]}>{available}</Text>
                                    <Text style={styles.statLabel}>Available</Text>
                                </View>
                                <View style={styles.statRow}>
                                    <Text style={[styles.statValue, styles.requestedValue]}>{requested}</Text>
                                    <Text style={styles.statLabel}>Requested</Text>
                                </View>
                                <View style={styles.statRow}>
                                    <Text style={[styles.statValue, styles.expiredValue]}>{expired}</Text>
                                    <Text style={styles.statLabel}>Expired</Text>
                                </View>

                                <TouchableOpacity
                                    style={styles.applyButton}
                                    onPress={() => navigation.navigate('CompOffApply')}
                                >
                                    <Text style={styles.applyButtonText}>Apply</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.grayBg,
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
    centeredContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: COLORS.grayText,
    },
    scrollContent: {
        padding: 16,
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderColor: '#e5e7eb',
        borderWidth: 1,
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    chartWrapper: {
        marginRight: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statsSection: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 12,
    },
    statRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    statValue: {
        fontSize: 16,
        fontWeight: 'bold',
        width: 30,
        textAlign: 'center',
    },
    totalValue: {
        color: COLORS.primary,
    },
    availableValue: {
        color: COLORS.blue,
    },
    requestedValue: {
        color: COLORS.orange,
    },
    expiredValue: {
        color: COLORS.yellow,
    },
    statLabel: {
        fontSize: 14,
        color: '#333',
        marginLeft: 10,
    },
    applyButton: {
        backgroundColor: '#3e6b9c',
        paddingHorizontal: 24,
        paddingVertical: 8,
        borderRadius: 6,
        alignSelf: 'flex-end',
        marginTop: 10,
    },
    applyButtonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
});

export default CompOffGrantScreen;
