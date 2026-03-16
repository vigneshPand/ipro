import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    StyleSheet,
    Platform,
    Pressable,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../../utils/theme';

const formatDisplay = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    const day = d.getDate();
    const month = d.toLocaleString('default', { month: 'short' });
    return `${day} ${month}`;
};

const toYMD = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const DateRangeFilter = ({ fromDate, toDate, onChange, onClear, defaultFromDate = null, defaultToDate = null }) => {
    const [visible, setVisible] = useState(false);
    const [step, setStep] = useState('start'); // 'start' | 'end'
    const [tempStart, setTempStart] = useState(new Date());
    const [tempEnd, setTempEnd] = useState(new Date());
    // Android inline picker controls
    const [showAndroidPicker, setShowAndroidPicker] = useState(false);

    const hasFilter = (fromDate && fromDate !== defaultFromDate) || (toDate && toDate !== defaultToDate);

    const openPicker = useCallback(() => {
        // Initialise temp dates
        setTempStart(fromDate ? new Date(fromDate + 'T00:00:00') : new Date());
        setTempEnd(toDate ? new Date(toDate + 'T00:00:00') : new Date());
        setStep('start');
        setVisible(true);
        if (Platform.OS === 'android') {
            setShowAndroidPicker(true);
        }
    }, [fromDate, toDate]);

    /* ----------  iOS: inline pickers inside modal ---------- */
    const handleIOSConfirm = () => {
        if (step === 'start') {
            setStep('end');
            // If end date is before new start, reset it
            if (tempEnd < tempStart) setTempEnd(tempStart);
        } else {
            const from = toYMD(tempStart);
            const to = toYMD(tempEnd < tempStart ? tempStart : tempEnd);
            onChange({ fromDate: from, toDate: to });
            setVisible(false);
        }
    };

    /* ----------  Android: sequential native dialogs ---------- */
    const handleAndroidChange = (event, selectedDate) => {
        if (event.type === 'dismissed') {
            setShowAndroidPicker(false);
            setVisible(false);
            return;
        }
        if (step === 'start') {
            const picked = selectedDate || tempStart;
            setTempStart(picked);
            setStep('end');
            // tempEnd will be picked next
            setTempEnd(picked); // default end = start
            // Keep showAndroidPicker true so the second picker shows
        } else {
            setShowAndroidPicker(false);
            const endPicked = selectedDate || tempEnd;
            const finalEnd = endPicked < tempStart ? tempStart : endPicked;
            setTempEnd(finalEnd);
            const from = toYMD(tempStart);
            const to = toYMD(finalEnd);
            onChange({ fromDate: from, toDate: to });
            setVisible(false);
        }
    };

    const label = (fromDate || toDate)
        ? `${formatDisplay(fromDate)} - ${formatDisplay(toDate)}`
        : null;

    return (
        <View style={styles.wrapper}>
            <TouchableOpacity
                style={[styles.iconBtn, hasFilter && styles.iconBtnActive]}
                onPress={openPicker}
                activeOpacity={0.7}
            >
                <Icon
                    name="calendar-range"
                    size={18}
                    color={hasFilter ? '#fff' : COLORS.blue}
                />
                {label ? (
                    <Text style={[styles.activeLabel, !hasFilter && styles.inactiveLabel]} numberOfLines={1}>
                        {label}
                    </Text>
                ) : null}
                {hasFilter && (
                    <TouchableOpacity
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        onPress={(e) => {
                            e.stopPropagation?.();
                            onClear();
                        }}
                        style={styles.clearBtn}
                    >
                        <Icon name="close-circle" size={14} color="#fff" />
                    </TouchableOpacity>
                )}
            </TouchableOpacity>

            {/* ---------- Android native date pickers ---------- */}
            {Platform.OS === 'android' && visible && showAndroidPicker && (
                <DateTimePicker
                    value={step === 'start' ? tempStart : tempEnd}
                    mode="date"
                    display="default"
                    onChange={handleAndroidChange}
                />
            )}

            {/* ---------- iOS modal with inline picker ---------- */}
            {Platform.OS === 'ios' && (
                <Modal
                    visible={visible}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setVisible(false)}
                >
                    <Pressable
                        style={styles.backdrop}
                        onPress={() => setVisible(false)}
                    >
                        <Pressable style={styles.modalContent}>
                            <Text style={styles.modalTitle}>
                                {step === 'start'
                                    ? 'Select Start Date'
                                    : 'Select End Date'}
                            </Text>

                            <DateTimePicker
                                value={step === 'start' ? tempStart : tempEnd}
                                mode="date"
                                display="inline"
                                onChange={(_, date) => {
                                    if (date) {
                                        step === 'start'
                                            ? setTempStart(date)
                                            : setTempEnd(date);
                                    }
                                }}
                                minimumDate={
                                    step === 'end' ? tempStart : undefined
                                }
                                style={styles.dateTimePicker}
                            />

                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    onPress={() => setVisible(false)}
                                    style={styles.cancelBtn}
                                >
                                    <Text style={styles.cancelText}>
                                        Cancel
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleIOSConfirm}
                                    style={styles.confirmBtn}
                                >
                                    <Text style={styles.confirmText}>
                                        {step === 'start'
                                            ? 'Next'
                                            : 'Confirm'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </Pressable>
                    </Pressable>
                </Modal>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: { marginRight: 8 },
    iconBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.blue,
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: '#fff',
    },
    iconBtnActive: {
        backgroundColor: COLORS.blue,
        borderColor: COLORS.blue,
    },
    activeLabel: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600',
        marginLeft: 4,
        maxWidth: 110,
    },
    inactiveLabel: {
        color: COLORS.blue,
    },
    clearBtn: {
        marginLeft: 4,
    },
    // iOS modal
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '90%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        ...(Platform.OS === 'ios' && {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
        }),
        ...(Platform.OS === 'android' && {
            elevation: 10,
        }),
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.blue,
        textAlign: 'center',
        marginBottom: 8,
    },
    dateTimePicker: {
        height: 340,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 12,
        gap: 10,
    },
    cancelBtn: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
    },
    cancelText: {
        color: COLORS.grayText,
        fontWeight: '600',
    },
    confirmBtn: {
        backgroundColor: COLORS.blue,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    confirmText: {
        color: '#fff',
        fontWeight: '700',
    },
});

export default DateRangeFilter;
