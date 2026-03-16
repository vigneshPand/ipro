import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../utils/theme';
import PieChart from '../../components/common/PieChart';
import useLeaveStore from '../../store/useLeaveStore';
import AuthService from '../../services/AuthService';

const parseNumber = (val) => {
    return parseFloat(val) || 0;
};

// Extracted PieChart logic to components/common/PieChart

const WFHRequestScreen = ({ navigation }) => {
    const { leaveBalances, loading, error, fetchLeaveBalances } = useLeaveStore();
    const [initialLoad, setInitialLoad] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = useCallback(async () => {
        try {
            const user = await AuthService.getUserInfo();
            if (user?.userId) {
                const year = new Date().getFullYear();
                await fetchLeaveBalances(user.userId, year);
            }
        } finally {
            setInitialLoad(false);
        }
    }, [fetchLeaveBalances]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const wfhBalance = leaveBalances.find(item => item.title === 'Work From Home');
    const requestedVal = parseNumber(wfhBalance?.requested || '0');
    const usedVal = parseNumber(wfhBalance?.used || '0') + parseNumber(wfhBalance?.approved || '0');
    const totalVal = requestedVal + usedVal;

    const renderContent = () => {
        if (loading && initialLoad) {
            return (
                <View style={styles.centeredContainer}>
                    <ActivityIndicator size="large" color={COLORS.blue} />
                    <Text style={styles.loadingText}>Loading balance...</Text>
                </View>
            );
        }

        if (error) {
            return (
                <View style={styles.centeredContainer}>
                    <Icon name="alert-circle-outline" size={48} color={COLORS.grayText} />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={loadData}>
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return (
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.blue]} tintColor={COLORS.blue} />
                }
            >
                <View style={styles.cardContainer}>
                    <View style={styles.cardRow}>
                        {/* Pie Chart */}
                        <View style={styles.chartWrapper}>
                            <PieChart
                                total={totalVal}
                                slices={[
                                    { value: totalVal, isBase: true, color: COLORS.red },
                                    { value: requestedVal, color: COLORS.yellow }
                                ]}
                            />
                        </View>

                        {/* Stats */}
                        <View style={styles.statsSection}>
                            <Text style={styles.cardTitle}>Work From Home</Text>

                            <View style={styles.statRow}>
                                <Text style={[styles.statValue, { color: COLORS.yellow }]}>{requestedVal}</Text>
                                <Text style={styles.statLabel}>Requested</Text>
                            </View>
                            <View style={styles.statRow}>
                                <Text style={[styles.statValue, { color: COLORS.red }]}>{usedVal}</Text>
                                <Text style={styles.statLabel}>Used</Text>
                            </View>

                            <TouchableOpacity
                                style={styles.applyButton}
                                onPress={() => navigation.navigate('LeaveApply', {
                                    leaveType: 'Work From Home',
                                    balance: null
                                })}
                            >
                                <Text style={styles.applyButtonText}>Apply</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.menuButton}>
                        <Icon name="menu" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>WFH Request</Text>
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
    scrollContent: {
        padding: 16,
    },
    cardContainer: {
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
        color: '#20b2aa', // Matches Work From Home color mapping
        marginBottom: 12,
    },
    statRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    statValue: {
        fontSize: 16,
        fontWeight: 'bold',
        width: 30,
        textAlign: 'center',
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

export default WFHRequestScreen;
