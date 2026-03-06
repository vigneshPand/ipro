import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import DatePicker from 'react-native-date-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../../utils/theme';

const DatePickerField = ({ label, date, onDateChange, minimumDate, formatDate, disabled }) => {
    const [open, setOpen] = useState(false);

    return (
        <View style={styles.dateBlock}>
            <Text style={styles.label}>
                {label}<Text style={styles.asterisk}>*</Text>
            </Text>
            <TouchableOpacity
                style={[styles.dateBox, disabled && styles.disabledBox]}
                onPress={() => setOpen(true)}
                disabled={disabled}
            >
                <Text style={[styles.dateBoxText, (!date || disabled) && styles.placeholderText]}>
                    {date ? formatDate(date) : 'Select date'}
                </Text>
                <Icon name="calendar-month-outline" size={20} color={disabled ? '#9ca3af' : COLORS.blue} />
            </TouchableOpacity>
            <DatePicker
                modal
                mode="date"
                open={open}
                date={date || new Date()}
                minimumDate={minimumDate || new Date()}
                onConfirm={(selectedDate) => {
                    setOpen(false);
                    onDateChange(selectedDate);
                }}
                onCancel={() => setOpen(false)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    dateBlock: {
        flex: 1,
    },
    label: {
        fontSize: 14,
        color: COLORS.darkText,
        fontWeight: '600',
    },
    asterisk: {
        color: COLORS.red,
    },
    dateBox: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 2,
        justifyContent: 'space-between',
        height: 38,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 6,
        paddingHorizontal: 10,
        backgroundColor: COLORS.white,
    },
    disabledBox: {
        backgroundColor: '#f3f4f6',
        borderColor: '#e5e7eb',
    },
    dateBoxText: {
        fontSize: 13,
        color: COLORS.darkText,
        flex: 1,
    },
    placeholderText: {
        color: '#9ca3af',
    },
});

export default DatePickerField;
