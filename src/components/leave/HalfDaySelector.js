import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../../utils/theme';

const DEFAULT_SESSIONS = ['Full Day', 'First Half', 'Second Half'];

const HalfDaySelector = ({ date, selectedSession, sessionTypes, onSelect, formatDate, leaveType }) => {
    const [isFocus, setIsFocus] = useState(false);
    const optionsList = (sessionTypes && sessionTypes.length > 0) ? sessionTypes : DEFAULT_SESSIONS;
    
    // Convert options to Dropdown format
    const dropdownData = optionsList.map(option => ({
        label: option,
        value: option,
    }));

    return (
        <View style={styles.dateBlock}>
            {leaveType === 'Work From Home' ? 
             null : (
                <View style={styles.halfDayRow}>
                    <View style={styles.indicatorStrip} />
                    <Text style={styles.dateValueText}>{formatDate(date)}</Text>
                    <View style={styles.dropdownWrapper}>
                        <Dropdown
                            style={[styles.dropdown, isFocus && styles.dropdownFocus]}
                            placeholderStyle={styles.placeholderStyle}
                            selectedTextStyle={styles.selectedTextStyle}
                            itemTextStyle={styles.itemTextStyle}
                            iconStyle={styles.iconStyle}
                            data={dropdownData}
                            
                            maxHeight={200}
                            labelField="label"
                            valueField="value"
                            placeholder={!isFocus ? selectedSession : '...'}
                            value={selectedSession}
                            onFocus={() => setIsFocus(true)}
                            onBlur={() => setIsFocus(false)}
                            onChange={item => {
                                onSelect(item.value);
                                setIsFocus(false);
                            }}
                            renderLeftIcon={() => (
                                <Icon
                                    style={styles.icon}
                                    color={isFocus ? COLORS.blue : COLORS.darkText}
                                    name="menu-down"
                                    size={16}
                                />
                            )}
                        />
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    dateBlock: {
        flex: 1,
        zIndex: 999,
        overflow: 'visible',
    },
    halfDayRow: {
        flexDirection: 'row',
        width: '100%',
        alignItems: 'center',
        marginBottom: 8,
        zIndex: 999,
        overflow: 'visible',
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
    dropdownWrapper: {
        flex: 1,
    },
    dropdown: {
        height: 32,
        borderColor: '#e5e7eb',
        borderWidth: 1,
        borderRadius: 4,
        paddingHorizontal: 8,
        backgroundColor: '#fff',
    },
    dropdownFocus: {
        borderColor: COLORS.blue,
    },
    icon: {
        marginRight: 8,
    },
    placeholderStyle: {
        fontSize: 11,
        color: '#9ca3af',
    },
    selectedTextStyle: {
        fontSize: 11,
        color: COLORS.darkText,
    },
    itemTextStyle: {
        fontSize: 10,
        color: COLORS.darkText,
    },
    iconStyle: {
        width: 16,
        height: 16,
    },
});

export default HalfDaySelector;
