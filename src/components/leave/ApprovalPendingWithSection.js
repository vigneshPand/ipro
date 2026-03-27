import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const ApprovalPendingWithSection = ({
    managers,
    onTransfer,
    onManagerSelect,
    isLoading,
    currentManagerName
}) => {
    const [selectedManager, setSelectedManager] = useState(null);
    const [isFocus, setIsFocus] = useState(false);

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>Approval Pending With</Text>

            <View style={styles.contentRow}>
                <View style={styles.dropdownWrapper}>
                    <Dropdown
                        style={[styles.dropdown, isFocus && styles.dropdownFocus]}
                        placeholderStyle={styles.placeholderStyle}
                        selectedTextStyle={styles.selectedTextStyle}
                        inputSearchStyle={styles.inputSearchStyle}
                        iconStyle={styles.iconStyle}
                        data={managers}
                        search
                        maxHeight={300}
                        labelField="label"
                        valueField="value"
                        placeholder={!isFocus ? 'Select Manager' : '...'}
                        searchPlaceholder="Search..."
                        value={selectedManager}
                        onFocus={() => setIsFocus(true)}
                        onBlur={() => setIsFocus(false)}
                        onChange={item => {
                            setSelectedManager(item.value);
                            setIsFocus(false);
                            if (typeof onManagerSelect === 'function') {
                                onManagerSelect(item.value);
                            }
                        }}
                        renderLeftIcon={() => (
                            <Icon
                                style={styles.icon}
                                color={isFocus ? '#3b82f6' : '#9ca3af'}
                                name="account-search"
                                size={20}
                            />
                        )}
                    />
                </View>

                <TouchableOpacity
                    style={[
                        styles.transferBtn,
                        (!selectedManager || isLoading) && styles.disabledBtn
                    ]}
                    onPress={() => onTransfer(selectedManager)}
                    disabled={!selectedManager || isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.transferBtnText}>Transfer</Text>
                    )}
                </TouchableOpacity>
            </View>

            {currentManagerName && (
                <Text style={styles.currentManagerText}>
                    Currently with: <Text style={styles.boldText}>{currentManagerName}</Text>
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    sectionTitle: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '600',
        marginBottom: 8,
    },
    contentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    dropdownWrapper: {
        flex: 1,
    },
    dropdown: {
        height: 40,
        borderColor: '#e5e7eb',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 8,
        backgroundColor: '#f9fafb',
    },
    dropdownFocus: {
        borderColor: '#3b82f6',
    },
    icon: {
        marginRight: 8,
    },
    placeholderStyle: {
        fontSize: 14,
        color: '#9ca3af',
    },
    selectedTextStyle: {
        fontSize: 14,
        color: '#1f2937',
    },
    iconStyle: {
        width: 20,
        height: 20,
    },
    inputSearchStyle: {
        height: 40,
        fontSize: 14,
        borderRadius: 6,
    },
    transferBtn: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 16,
        height: 35,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 90,
    },
    disabledBtn: {
        backgroundColor: '#93c5fd',
    },
    transferBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    currentManagerText: {
        marginTop: 6,
        fontSize: 12,
        color: '#6b7280',
    },
    boldText: {
        color: '#1f2937',
        fontWeight: '600',
    }
});

export default ApprovalPendingWithSection;

