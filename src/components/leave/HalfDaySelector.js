import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../../utils/theme';

const DEFAULT_SESSIONS = ['Full Day', 'First Half', 'Second Half'];

const HalfDaySelector = ({ date, selectedSession, sessionTypes, onSelect, formatDate }) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const options = (sessionTypes && sessionTypes.length > 0) ? sessionTypes : DEFAULT_SESSIONS;

    return (
        <View style={styles.dateBlock}>
            <View style={styles.halfDayRow}>
                <View style={styles.indicatorStrip} />
                <Text style={styles.dateValueText}>{formatDate(date)}</Text>
                <View style={styles.dropdownContainer}>
                    <TouchableOpacity
                        style={styles.dropdownBox}
                        onPress={() => setShowDropdown(!showDropdown)}
                    >
                        <Text style={styles.dropdownBoxText}>{selectedSession}</Text>
                        <Icon name="menu-down" size={16} color={COLORS.darkText} />
                    </TouchableOpacity>
                    {showDropdown && (
                        <View style={styles.dropdownList}>
                            {options.map((option) => (
                                <TouchableOpacity
                                    key={option}
                                    style={styles.dropdownOption}
                                    onPress={() => {
                                        onSelect(option);
                                        setShowDropdown(false);
                                    }}
                                >
                                    <Text style={styles.dropdownOptionText}>{option}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    dateBlock: {
        flex: 1,
    },
    halfDayRow: {
        flexDirection: 'row',
        width: '100%',
        alignItems: 'center',
        marginBottom: 8,
    },
    indicatorStrip: {
        width: 4,
        height: '100%',
        minHeight: 24,
        backgroundColor: COLORS.blue,
        marginRight: 8,
    },
    dateValueText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.darkText,
        marginRight: 8,
        minWidth: 85,
    },
    dropdownContainer: {
        flex: 1,
        position: 'relative',
    },
    dropdownBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        paddingHorizontal: 8,
        height: 32,
        borderRadius: 4,
        backgroundColor: '#fff',
        minWidth: 100,
    },
    dropdownBoxText: {
        fontSize: 11,
        color: COLORS.darkText,
    },
    dropdownList: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 4,
        zIndex: 999,
        elevation: 8,
    },
    dropdownOption: {
        padding: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    dropdownOptionText: {
        fontSize: 11,
        color: COLORS.darkText,
    },
});

export default HalfDaySelector;
