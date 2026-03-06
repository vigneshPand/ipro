import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
        case 'approved': return '#10b981';
        case 'rejected': return '#ef4444';
        case 'pending': return '#f59e0b';
        default: return '#6b7280';
    }
};

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${String(date.getDate()).padStart(2, '0')}-${date.toLocaleString('default', { month: 'short' })}-${date.getFullYear()}`;
};

const HistoryLeaveCard = ({ item, onPress }) => {
    return (
        <TouchableOpacity style={styles.card} onPress={() => onPress(item)} activeOpacity={0.7}>
            <View style={styles.cardHeader}>
                <Text style={styles.leaveType}>{item.type}</Text>
                <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(item.status) }]}>
                    <Text style={styles.statusText}>{item.status}</Text>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.row}>
                <Text style={styles.label}>Start Date:</Text>
                <Text style={styles.value}>{formatDate(item.startDate)}</Text>
            </View>

            <View style={styles.row}>
                <Text style={styles.label}>End Date:</Text>
                <Text style={styles.value}>{formatDate(item.endDate)}</Text>
            </View>

            <View style={styles.row}>
                <Text style={styles.label}>No of Days:</Text>
                <Text style={styles.value}>{item.noOfDays}</Text>
            </View>

            <View style={styles.row}>
                <Text style={styles.label}>Reviewed By:</Text>
                <Text style={styles.value}>{item.reviewedBy || 'N/A'}</Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    leaveType: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1f2937',
        flex: 1,
    },
    statusIndicator: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    divider: {
        height: 1,
        backgroundColor: '#f3f4f6',
        marginBottom: 12,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    label: {
        fontSize: 13,
        color: '#6b7280',
        fontWeight: '500',
        flex: 1,
    },
    value: {
        fontSize: 13,
        color: '#374151',
        fontWeight: '600',
        flex: 2,
        textAlign: 'right',
    },
});

export default HistoryLeaveCard;
