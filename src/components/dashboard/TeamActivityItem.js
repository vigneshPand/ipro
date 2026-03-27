import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import Icons from 'react-native-vector-icons/MaterialCommunityIcons';
import moment from 'moment';
import { COLORS, SHADOW } from '../../utils/theme';

const TeamActivityItem = ({ item }) => (
    <View style={styles.container}>
        <View style={styles.avatarContainer}>
            {item.profile ? (
                <Image source={{ uri: item.profile }} style={styles.avatar} />
            ) : (
                <View style={styles.fallbackAvatar}>
                    <Text style={styles.avatarText}>
                        {item.name ? item.name.trim().charAt(0).toUpperCase() : '?'}
                    </Text>
                </View>
            )}
        </View>
        <View style={styles.details}>
            <View style={styles.header}>
                <Text style={styles.name} numberOfLines={1}>{item.name || 'Unknown'}</Text>
                <Text style={styles.time}>
                    {item.time ? moment(item.time, 'HH:mm:ss').format('hh:mm A') : ''}
                </Text>
            </View>
            <View style={styles.statusRow}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status || 'Pending'}</Text>
                </View>
                {item.location && (
                    <View style={styles.locationContainer}>
                        <Icons name="map-marker" size={12} color="#888" />
                        <Text style={styles.location}>{item.location}</Text>
                    </View>
                )}
            </View>
        </View>
    </View>
);

const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
        case 'checked-in':
        case 'checkin':
        case 'present':
        case 'checked in':
            return COLORS.primary;
        case 'pending':
            return '#f39c12';
        case 'on leave':
        case 'onleave':
        case 'absent':
        case 'leave':
            return COLORS.error;
        case 'checked-out':
        case 'checkout':
        case 'checked out':
            return '#9b59b6';
        default:
            return '#95a5a6';
    }
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        padding: 14,
        backgroundColor: '#fff',
        borderRadius: 15,
        marginBottom: 12,
        alignItems: 'center',
        ...SHADOW,
    },
    avatarContainer: {
        marginRight: 14,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    fallbackAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#e6ecf2',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    details: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
    },
    time: {
        fontSize: 12,
        color: '#888',
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    location: {
        fontSize: 12,
        color: '#888',
    }
});

export default TeamActivityItem;
