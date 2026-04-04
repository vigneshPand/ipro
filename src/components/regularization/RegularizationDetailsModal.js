import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import useRegularizationHistoryStore from '../../store/useRegularizationHistoryStore';
import WithdrawConfirmationModal from '../leave/WithdrawConfirmationModal';
import LoadingOverlay from '../LoadingOverlay';

import { formatDate } from '../../utils/dateUtils';
import { getStatusColor } from '../../utils/statusUtils';
import { buildEntryRows } from '../../utils/regularizationUtils';

// ─── Component ───────────────────────────────────────────────────────────────

const RegularizationDetailsModal = ({ visible, onClose, showWithdraw = false, onWithdrawSuccess }) => {
    const {
        selectedItem,
        detailsData,
        loadingDetails,
        previousEntries,
        isPreviousView,
        loadingPreviousEntries,
        fetchPreviousEntries,
        refreshDetails,
        withdrawRequest,
        clearSelectedDetails,
    } = useRegularizationHistoryStore();

    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const [overlay, setOverlay] = useState({
        visible: false,
        message: '',
        type: 'loading',
        onConfirm: null,
        onCancel: null,
    });

    const hideOverlay = useCallback(() =>
        setOverlay(prev => ({ ...prev, visible: false })), []);
    const showSuccess = useCallback((message, onConfirm = hideOverlay) =>
        setOverlay({ visible: true, message, type: 'success', onConfirm }), [hideOverlay]);
    const showError = useCallback((message) =>
        setOverlay({ visible: true, message, type: 'error', onConfirm: hideOverlay }), [hideOverlay]);

    // Reset overlay state when modal visibility changes to prevent stale popups
    React.useEffect(() => {
        if (!visible) {
            setOverlay({ visible: false, message: '', type: 'loading', onConfirm: null, onCancel: null });
            setShowWithdrawModal(false);
        }
    }, [visible]);

    const handleTogglePreviousEntries = async () => {
        if (!selectedItem) return;
        const requestId = selectedItem.requestId;
        if (isPreviousView) {
            // Currently showing previous → switch back to updated
            await refreshDetails(requestId);
        } else {
            // Currently showing updated → switch to previous
            await fetchPreviousEntries(requestId);
        }
    };

    const handleWithdraw = async (remarks) => {
        if (!selectedItem) return;
        setIsWithdrawing(true);
        const requestId = selectedItem.requestId;
        const res = await withdrawRequest(requestId);
        setIsWithdrawing(false);
        setShowWithdrawModal(false);

        if (res.success) {
            showSuccess(res.message, () => {
                hideOverlay();
                clearSelectedDetails();
                onClose();
                if (onWithdrawSuccess) onWithdrawSuccess();
            });
        } else {
            showError(res.message || 'Something went wrong. Please try again.');
            // Refresh list even on failure
            if (onWithdrawSuccess) onWithdrawSuccess();
        }
    };

    const entriesToShow = isPreviousView
        ? previousEntries || []
        : detailsData?.regularizationRecords || [];

    const toggleButtonLabel = isPreviousView ? 'See Updated Entries' : 'See Previous Entries';
    const rows = buildEntryRows(entriesToShow);

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalCard}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Regularization Details</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Icon name="close" size={24} color="#374151" />
                        </TouchableOpacity>
                    </View>

                    {loadingDetails ? (
                        <View style={styles.loaderContainer}>
                            <ActivityIndicator size="large" color="#3b82f6" />
                        </View>
                    ) : !detailsData ? (
                        <View style={styles.loaderContainer}>
                            <Text style={styles.loadingText}>No details available</Text>
                        </View>
                    ) : (
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                            {/* Status Badge */}
                            <View style={styles.statusBadgeRow}>
                                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(detailsData.status) }]}>
                                    <Text style={styles.statusBadgeText}>{detailsData.status || 'PENDING'}</Text>
                                </View>
                            </View>

                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Applied On</Text>
                                <Text style={styles.detailValue}>{formatDate(detailsData.appliedOn)}</Text>
                            </View>

                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Regularization Date</Text>
                                <Text style={styles.detailValue}>{formatDate(detailsData.regularizedDate)}</Text>
                            </View>

                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Approval Pending With</Text>
                                <Text style={styles.detailValue}>{detailsData.approvedByName || '-'}</Text>
                            </View>

                            {/* Entries Section */}
                            <View style={styles.sectionBlock}>
                                <View style={styles.entriesHeaderRow}>
                                    <Text style={styles.sectionTitle}>
                                        {isPreviousView ? 'Previous Entries' : 'Entries'}
                                    </Text>
                                    <TouchableOpacity
                                        style={styles.toggleEntriesBtn}
                                        onPress={handleTogglePreviousEntries}
                                        disabled={loadingPreviousEntries}
                                    >
                                        <Text style={styles.toggleEntriesText}>{toggleButtonLabel}</Text>
                                    </TouchableOpacity>
                                </View>
                                {loadingPreviousEntries && (
                                    <ActivityIndicator size="small" color="#3b82f6" style={styles.loadingSpinner} />
                                )}
                                {(!entriesToShow || entriesToShow.length === 0) ? (
                                    <View style={styles.emptyEntriesContainer}>
                                        <Text style={styles.emptyEntriesText}>No entries are available</Text>
                                    </View>
                                ) : (
                                    rows.map((row, idx) => (
                                        <View key={idx} style={styles.entryPairCard}>
                                            {/* IN Entry */}
                                            {row.inEntry && (
                                                <View style={styles.entryRow}>
                                                    <Text style={[styles.entryType, styles.entryTypeIn]}>IN</Text>
                                                    <Text style={styles.entryMode}>{row.inEntry.workMode || '-'}</Text>
                                                    <Text style={styles.entryTime}>{row.inEntry.time || '-'}</Text>
                                                </View>
                                            )}
                                            {/* OUT Entry */}
                                            {row.outEntry && (
                                                <View style={styles.entryRow}>
                                                    <Text style={[styles.entryType, styles.entryTypeOut]}>OUT</Text>
                                                    <Text style={styles.entryMode}>{row.outEntry.workMode || '-'}</Text>
                                                    <Text style={styles.entryTime}>{row.outEntry.time || '-'}</Text>
                                                </View>
                                            )}
                                            {/* Remarks */}
                                            {row.inEntry?.remarks && (
                                                <View style={styles.remarksBlock}>
                                                    <Text style={styles.remarksLabel}>Remarks</Text>
                                                    <Text style={styles.remarksValue}>{row.inEntry.remarks}</Text>
                                                </View>
                                            )}
                                        </View>
                                    ))
                                )}
                            </View>

                            {/* Withdraw Button */}
                            {showWithdraw && (
                                <View style={styles.footerActionRow}>
                                    <TouchableOpacity style={styles.withdrawBtn} onPress={() => setShowWithdrawModal(true)}>
                                        <Text style={styles.withdrawBtnText}>WITHDRAW</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </ScrollView>
                    )}
                </View>

                {/* Withdraw Confirmation Modal */}
                <WithdrawConfirmationModal
                    visible={showWithdrawModal}
                    onClose={() => setShowWithdrawModal(false)}
                    onConfirm={handleWithdraw}
                    isLoading={isWithdrawing}
                    isRegularize={true}
                />

                <LoadingOverlay {...overlay} />
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalCard: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        maxHeight: '90%',
        minHeight: '50%',
        paddingBottom: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    closeBtn: {
        padding: 4,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6b7280',
    },
    scrollContent: {
        padding: 16,
    },
    statusBadgeRow: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    statusBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    detailLabel: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '500',
        flex: 1,
    },
    detailValue: {
        fontSize: 14,
        color: '#1f2937',
        fontWeight: '600',
        flex: 2,
        textAlign: 'right',
    },
    sectionBlock: {
        paddingVertical: 12,
    },
    entriesHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '600',
    },
    toggleEntriesBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#6092f6ff',
        borderRadius: 8,
        padding: 4,
        backgroundColor: '#e8f0feff',
    },
    toggleEntriesText: {
        fontSize: 13,
        color: '#3b82f6',
        fontWeight: '600',
    },
    loadingSpinner: {
        marginLeft: 6,
    },
    emptyEntriesContainer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    emptyEntriesText: {
        fontSize: 13,
        color: '#9ca3af',
        fontStyle: 'italic',
    },
    entryPairCard: {
        backgroundColor: '#f9fafb',
        borderRadius: 8,
        padding: 10,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    entryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 5,
    },
    entryType: {
        width: 36,
        fontSize: 12,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    entryTypeIn: {
        color: '#10b981',
    },
    entryTypeOut: {
        color: '#ef4444',
    },
    entryMode: {
        flex: 1,
        fontSize: 13,
        color: '#374151',
        fontWeight: '500',
    },
    entryTime: {
        fontSize: 13,
        color: '#3b82f6',
        fontWeight: '700',
        minWidth: 50,
        textAlign: 'right',
    },
    remarksBlock: {
        marginTop: 6,
        paddingTop: 6,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#e5e7eb',
    },
    remarksLabel: {
        fontSize: 12,
        color: '#6b7280',
        fontWeight: '600',
        marginBottom: 2,
    },
    remarksValue: {
        fontSize: 13,
        color: '#374151',
    },
    footerActionRow: {
        marginTop: 20,
        marginBottom: 10,
        alignItems: 'flex-end',
    },
    withdrawBtn: {
        backgroundColor: '#d32f2f',
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 6,
    },
    withdrawBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
        letterSpacing: 0.5,
    },
});

export default RegularizationDetailsModal;
