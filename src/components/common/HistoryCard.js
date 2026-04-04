import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { getStatusColor } from '../../utils/statusUtils';

const HistoryCard = ({
    title,
    status,
    details,
    onPress
}) => {
    return (
        <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={onPress}>
            <View style={styles.cardHeader}>
                <Text style={styles.titleText}>{title}</Text>
                {status && (
                    <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(status) }]}>
                        <Text style={styles.statusText}>{status}</Text>
                    </View>
                )}
            </View>

            <View style={styles.divider} />

            {details && details.map((detail, index) => {
                if (!detail.value) return null; // Skip empty fields

                return (
                    <View style={styles.row} key={index}>
                        <Text style={styles.label}>{detail.label}</Text>
                        <Text style={[styles.value, detail.color && { color: detail.color }]}>
                            {detail.value}
                        </Text>
                    </View>
                );
            })}
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
    titleText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1f2937',
        flex: 1,
    },
    statusIndicator: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginLeft: 10,
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
        textAlign: 'right'
    }
});

export default HistoryCard;
