import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    StyleSheet,
    FlatList,
    Pressable,
    Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../../utils/theme';

const DEFAULT_STATUSES = [
    'Approved',
    'Rejected',
    'Withdraw',
    'Pending',
    'Transfer',
];

const StatusFilter = ({
    selected = [],
    onChange,
    onClear,
    statuses = DEFAULT_STATUSES,
}) => {
    const [visible, setVisible] = useState(false);
    const [tempSelected, setTempSelected] = useState([]);

    const hasFilter = selected.length > 0;

    const openModal = () => {
        setTempSelected([...selected]);
        setVisible(true);
    };

    const toggle = (status) => {
        setTempSelected((prev) =>
            prev.includes(status)
                ? prev.filter((s) => s !== status)
                : [...prev, status],
        );
    };

    const handleConfirm = () => {
        onChange(tempSelected);
        setVisible(false);
    };

    const handleClearAll = () => {
        setTempSelected([]);
    };

    const label = useMemo(() => {
        if (selected.length === 0) return null;
        if (selected.length === 1) return selected[0];
        return `${selected.length} selected`;
    }, [selected]);

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'approved':
                return COLORS.statusApproved;
            case 'rejected':
                return COLORS.statusRejected;
            case 'pending':
                return COLORS.statusPending;
            case 'withdraw':
                return COLORS.statusWithdraw;
            case 'transfer':
                return COLORS.statusTransfer;
            default:
                return COLORS.statusDefault;
        }
    };

    const renderItem = ({ item }) => {
        const isChecked = tempSelected.includes(item);
        return (
            <TouchableOpacity
                style={styles.optionRow}
                onPress={() => toggle(item)}
                activeOpacity={0.6}
            >
                <Icon
                    name={isChecked ? 'checkbox-marked' : 'checkbox-blank-outline'}
                    size={22}
                    color={isChecked ? COLORS.blue : '#9ca3af'}
                />
                <View
                    style={[
                        styles.statusDot,
                        { backgroundColor: getStatusColor(item) },
                    ]}
                />
                <Text style={styles.optionText}>{item}</Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.wrapper}>
            <TouchableOpacity
                style={[styles.iconBtn, hasFilter && styles.iconBtnActive]}
                onPress={openModal}
                activeOpacity={0.7}
            >
                <Icon
                    name="filter-variant"
                    size={18}
                    color={hasFilter ? '#fff' : COLORS.blue}
                />
                {label ? (
                    <Text style={styles.activeLabel} numberOfLines={1}>
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

            {/* Multi-select modal */}
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
                        <Text style={styles.modalTitle}>Status</Text>

                        <FlatList
                            data={statuses}
                            keyExtractor={(item) => item}
                            renderItem={renderItem}
                            style={styles.list}
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                onPress={handleClearAll}
                                style={styles.clearAllBtn}
                            >
                                <Text style={styles.clearAllText}>
                                    Clear All
                                </Text>
                            </TouchableOpacity>
                            <View style={styles.rightActions}>
                                <TouchableOpacity
                                    onPress={() => setVisible(false)}
                                    style={styles.cancelBtn}
                                >
                                    <Text style={styles.cancelText}>
                                        Cancel
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleConfirm}
                                    style={styles.confirmBtn}
                                >
                                    <Text style={styles.confirmText}>
                                        Apply
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
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
        maxWidth: 100,
    },
    clearBtn: {
        marginLeft: 4,
    },
    // Modal
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '85%',
        maxHeight: '60%',
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
        marginBottom: 12,
    },
    list: {
        maxHeight: 280,
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 4,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#f3f4f6',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginLeft: 8,
    },
    optionText: {
        fontSize: 14,
        color: '#374151',
        marginLeft: 8,
        fontWeight: '500',
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 14,
    },
    rightActions: {
        flexDirection: 'row',
        gap: 8,
    },
    clearAllBtn: {
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    clearAllText: {
        color: COLORS.red || '#d32f2f',
        fontWeight: '600',
        fontSize: 13,
    },
    cancelBtn: {
        paddingHorizontal: 14,
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

export default StatusFilter;
