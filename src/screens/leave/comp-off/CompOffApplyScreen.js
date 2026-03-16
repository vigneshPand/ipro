import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AuthService from '../../../services/AuthService';
import LeaveService from '../../../services/LeaveService';
import DatePickerField from '../../../components/leave/DatePickerField';
import ReportsToSection from '../../../components/leave/ReportsToSection';
import useCompOffStore from '../../../store/useCompOffStore';
import { COLORS } from '../../../utils/theme';
import { formatToAPI, formatDate } from '../../../utils/dateUtils';
import LoadingOverlay from '../../../components/LoadingOverlay';

const CompOffApplyScreen = ({ navigation }) => {
    // Date state
    const [compOffDate, setCompOffDate] = useState(null);

    // Form state
    const [reason, setReason] = useState('');
    const [managerInfo, setManagerInfo] = useState({ name: 'Loading...', profile: null });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // CC List state
    const [ccList, setCCList] = useState([]);
    const [selectedCC, setSelectedCC] = useState([]);

    // Store
    const { applyCompOffGrant, fetchCompOffOverview } = useCompOffStore();

    // Overlay
    const [overlay, setOverlay] = useState({
        visible: false,
        message: '',
        type: 'loading',
        onConfirm: null,
        onCancel: null
    });

    const hideOverlay = useCallback(() => setOverlay(prev => ({ ...prev, visible: false })), []);
    const showSuccess = useCallback((message, onConfirm = hideOverlay) => setOverlay({ visible: true, message, type: 'success', onConfirm }), [hideOverlay]);
    const showError = useCallback((message) => setOverlay({ visible: true, message, type: 'error', onConfirm: hideOverlay }), [hideOverlay]);

    useEffect(() => {
        const loadCCList = async () => {
            try {
                const userInfo = await AuthService.getUserInfo();
                const userId = userInfo?.userId;
                const cc = await LeaveService.getCCList(userId);
                setCCList(cc);
            } catch (error) {
                console.warn('Failed to load CC list', error);
            }
        };

        const loadManagerInfo = async () => {
            try {
                const userInfo = await AuthService.getUserInfo();
                const userId = userInfo?.userId;
                const manager = await LeaveService.getManagerInfo(userId);
                if (manager) {
                    setManagerInfo({
                        name: manager.name || 'N/A',
                        profile: manager.profile || null,
                        designation: manager.designation || '',
                    });
                }
            } catch (error) {
                console.warn('Failed to load manager info', error);
            }
        };

        loadCCList();
        loadManagerInfo();
    }, []);

    const handleApply = async () => {
        if (isSubmitting) return;

        if (!compOffDate) {
            showError('Please select a date');
            return;
        }
        if (!reason.trim()) {
            showError('Please enter a reason');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                date: formatToAPI(compOffDate),
                reason: reason.trim()
            };

            if (selectedCC && selectedCC.length > 0) {
                payload.ccEmails = selectedCC.map(user => user.email).filter(Boolean);
            }

            const res = await applyCompOffGrant(payload);

            if (res.success) {
                // Refresh overview
                fetchCompOffOverview();

                showSuccess(res.message, () => {
                    hideOverlay();
                    navigation.goBack();
                });
            } else {
                showError(res.message);
            }
        } catch (error) {
            showError('An unexpected error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.modalBackground}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.keyboardView}
            >
                <View style={styles.modalCard}>
                    {/* Header */}
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Apply Comp. Off Grant</Text>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
                            <Icon name="close-circle" size={26} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {/* Subheader */}
                    <View style={styles.subHeader}>
                        <Text style={styles.subHeaderText}>
                            Applying for : <Text style={styles.subHeaderHighlight}>Comp-Off Grant</Text>
                        </Text>
                    </View>

                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Date Field */}
                        <View style={styles.fieldRow}>
                            <DatePickerField
                                label="Date"
                                date={compOffDate}
                                onDateChange={setCompOffDate}
                                formatDate={formatDate}
                                minimumDate={null}
                                maximumDate={new Date()}
                            />
                        </View>

                        <View style={styles.divider} />

                        {/* Reports To Section */}
                        <ReportsToSection
                            managerInfo={managerInfo}
                            ccList={ccList}
                            selectedCC={selectedCC}
                            setSelectedCC={setSelectedCC}
                        />

                        {/* Reason */}
                        <View style={styles.reasonSection}>
                            <Text style={styles.label}>Reason<Text style={styles.asterisk}>*</Text></Text>
                            <TextInput
                                style={styles.reasonInput}
                                multiline={true}
                                numberOfLines={4}
                                value={reason}
                                onChangeText={setReason}
                                placeholder="Enter reason for comp-off grant"
                                placeholderTextColor="#9ca3af"
                            />
                        </View>

                        <View style={styles.divider} />

                        {/* Buttons Row */}
                        <View style={styles.actionRow}>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.applyButton, isSubmitting && styles.disabledButton]}
                                disabled={isSubmitting}
                                onPress={handleApply}
                            >
                                {isSubmitting ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.applyButtonText}>Apply</Text>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={() => navigation.goBack()} disabled={isSubmitting}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>

                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
            <LoadingOverlay {...overlay} />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    modalBackground: {
        flex: 1,
        backgroundColor: COLORS.pageBg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    keyboardView: {
        width: '100%',
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    modalCard: {
        backgroundColor: COLORS.white,
        borderRadius: 8,
        width: '100%',
        maxWidth: 600,
        maxHeight: '90%',
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    modalHeader: {
        backgroundColor: '#3E699B',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    modalTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    closeBtn: {
        padding: 2,
    },
    subHeader: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    subHeaderText: {
        fontSize: 14,
        color: '#333',
    },
    subHeaderHighlight: {
        color: COLORS.primary,
        fontWeight: 'bold',
    },
    scrollContent: {
        padding: 16,
    },
    fieldRow: {
        marginBottom: 16,
    },
    divider: {
        height: 1,
        backgroundColor: '#e5e7eb',
        marginVertical: 12,
    },
    reasonSection: {
        marginTop: 12,
    },
    label: {
        fontSize: 14,
        color: COLORS.darkText,
        fontWeight: '600',
    },
    asterisk: {
        color: COLORS.red,
    },
    reasonInput: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 6,
        padding: 10,
        fontSize: 13,
        color: COLORS.darkText,
        backgroundColor: COLORS.inputBg,
        textAlignVertical: 'top',
        minHeight: 80,
        marginTop: 6,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
        marginTop: 16,
    },
    actionButton: {
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 6,
        minWidth: 80,
        alignItems: 'center',
    },
    applyButton: {
        backgroundColor: '#3e6b9c',
    },
    cancelButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: COLORS.red,
    },
    disabledButton: {
        backgroundColor: '#ccc',
    },
    applyButtonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    cancelButtonText: {
        color: COLORS.red,
        fontSize: 13,
        fontWeight: '600',
    },
});

export default CompOffApplyScreen;
