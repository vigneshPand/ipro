import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../utils/theme';

const CCChips = ({ ccList }) => {
    if (!ccList || ccList.length === 0) return null;

    return (
        <View style={styles.container}>
            {ccList.map((cc, index) => (
                <View key={index} style={styles.chip}>
                    <Text style={styles.chipText}>{cc}</Text>
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 4,
    },
    chip: {
        backgroundColor: '#f3f4f6',
        borderRadius: 16,
        paddingHorizontal: 10,
        paddingVertical: 4,
        marginRight: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    chipText: {
        fontSize: 12,
        color: COLORS.darkText,
    },
});

export default CCChips;
