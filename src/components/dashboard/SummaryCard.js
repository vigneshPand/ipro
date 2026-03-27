import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SHADOW } from '../../utils/theme';
import Icons from 'react-native-vector-icons/FontAwesome';

const SummaryCard = ({ label, value, color, isFullWidth, icon }) => (
    <View style={[styles.card, isFullWidth && styles.fullWidth]}>

        {/* Top Right Icon */}
        {icon && (
            <View style={[styles.iconWrapper, { backgroundColor: color || COLORS.primary }]}>
                <Icons name={icon} size={15} color="#fff" />
            </View>
        )}

        <View style={styles.content}>
            <Text style={[styles.value, { color: color || '#333' }]}>
                {value || '0'}
            </Text>
            <Text style={styles.label}>{label}</Text>
        </View>

    </View>
);

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 16,
        marginBottom: 12,
        width: '48%',
        position: 'relative',
        ...SHADOW,
    },
    fullWidth: {
        width: '100%',
    },
    content: {
        flex: 1,
    },
    value: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    label: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
        fontWeight: '600',
    },
    iconWrapper: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 26,
        height: 26,
        borderRadius: 13,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default SummaryCard;