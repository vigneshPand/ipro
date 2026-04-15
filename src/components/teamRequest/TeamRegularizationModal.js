import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    Modal,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LoadingOverlay from '../LoadingOverlay';
import ApprovalPendingWithSection from '../leave/ApprovalPendingWithSection';
import WithdrawConfirmationModal from '../leave/WithdrawConfirmationModal';
import useManagerStore from '../../store/useManagerStore';
import AuthService from '../../services/AuthService';

import { formatDate } from '../../utils/dateUtils';
import { getStatusColor } from '../../utils/statusUtils';
import { buildEntryRows } from '../../utils/regularizationUtils';

const TeamRegularizationModal = ({
    visible,
    onClose,
    store,
    managerUserId,
    isPending = false,
    onActionSuccess,
}) => {
    const {
        selectedItem,
        detailsData,
        loadingDetails,
        previousEntries,
        isPreviousView,
        loadingPreviousEntries,
        fetchPreviousEntries,
        refreshDetails,
        approveRequest,
        rejectRequest,
        transferRequest,
        refetchPendingAfterAction,
        clearSelectedDetails,
    } = store();

    const { managers, fetchManagers } = useManagerStore();

    // ── Local state ──
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [isTransferring, setIsTransferring] = useState(false);
    const [overlay, setOverlay] = useState({
        visible: false, message: '', type: 'loading', onConfirm: null, onCancel: null,
    });

    const hideOverlay = useCallback(() => setOverlay(prev => ({ ...prev, visible: false })), []);
    const showSuccess = useCallback((msg, onConfirm = hideOverlay) => setOverlay({ visible: true, message: msg, type: 'success', onConfirm }), [hideOverlay]);
    const showError = useCallback((msg) => setOverlay({ visible: true, message: msg, type: 'error', onConfirm: hideOverlay }), [hideOverlay]);

    useEffect(() => {
        if (visible) {
            AuthService.getUserInfo().then(user => {
                if (user?.userId) {
                    fetchManagers(user.userId);
                }
            });
        }
    }, [visible, fetchManagers]);

    // Reset local state when modal closes
    useEffect(() => {
        if (!visible) {
            setShowApproveModal(false);
            setShowRejectModal(false);
            setOverlay({ visible: false, message: '', type: 'loading', onConfirm: null, onCancel: null });
            setIsTransferring(false);
        }
    }, [visible]);

    // ── Toggle previous / updated entries ──
    const handleTogglePreviousEntries = async () => {
        if (!selectedItem) return;
        const requestId = selectedItem.requestId;
        if (isPreviousView) {
            await refreshDetails(requestId);
        } else {
            await fetchPreviousEntries(requestId);
        }
    };

    // ── Approve ──
    const handleApproveConfirm = async (comments) => {
        if (!selectedItem || !managerUserId) return;
        setActionLoading(true);
        setShowApproveModal(false);

        // Call API: approveRequest(statusId, approvedByUser, remarks)
        const res = await approveRequest(selectedItem.requestId, managerUserId, comments);
        setActionLoading(false);

        if (res.success) {
            showSuccess(res.message || 'Approved Successfully', async () => {
                hideOverlay();
                clearSelectedDetails();
                onClose();
                // Refetch pending list
                const year = new Date().getFullYear();
                await refetchPendingAfterAction(managerUserId, year);
                if (onActionSuccess) onActionSuccess();
            });
        } else {
            showError(res.message || 'Something went wrong');
            if (onActionSuccess) onActionSuccess();
        }
    };

    // ── Reject ──
    const handleRejectConfirm = async (comments) => {
        if (!selectedItem || !managerUserId) return;
        setActionLoading(true);

        // Call API: rejectRequest(statusId, rejectedByUser, remarks)
        const res = await rejectRequest(selectedItem.requestId, managerUserId, comments);
        setActionLoading(false);
        setShowRejectModal(false);

        if (res.success) {
            showSuccess(res.message || 'Rejected Successfully', async () => {
                hideOverlay();
                clearSelectedDetails();
                onClose();
                // Refetch pending list
                const year = new Date().getFullYear();
                await refetchPendingAfterAction(managerUserId, year);
                if (onActionSuccess) onActionSuccess();
            });
        } else {
            showError(res.message || 'Something went wrong');
            if (onActionSuccess) onActionSuccess();
        }
    };

    // ── Transfer ──
    const handleTransfer = async (managerId) => {
        if (!selectedItem) return;
        setIsTransferring(true);
        const res = await transferRequest(selectedItem.requestId, managerId);
        setIsTransferring(false);
        if (res.success) {
            showSuccess(res.message || 'Transferred Successfully', () => {
                hideOverlay();
                clearSelectedDetails();
                onClose();
                if (onActionSuccess) onActionSuccess();
            });
        } else {
            showError(res.message || 'Failed to transfer request');
            if (onActionSuccess) onActionSuccess();
        }
    };

    const entriesToShow = isPreviousView
        ? (previousEntries || [])
        : (detailsData?.regularizationRecords || []);

    const rows = buildEntryRows(entriesToShow);
    const toggleLabel = isPreviousView ? 'See Updated Entries' : 'See Previous Entries';

    const status = detailsData?.status?.toLowerCase();
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.card}>

                    {/* ── Header ── */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Regularization Details</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Icon name="close" size={24} color="#374151" />
                        </TouchableOpacity>
                    </View>

                    {/* ── Body ── */}
                    {loadingDetails ? (
                        <View style={styles.loaderWrap}>
                            <ActivityIndicator size="large" color="#3b82f6" />
                        </View>
                    ) : !detailsData ? (
                        <View style={styles.loaderWrap}>
                            <Text style={styles.emptyText}>No details available</Text>
                        </View>
                    ) : (
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.scrollContent}
                        >
                            {/* Status badge */}
                            <View style={styles.badgeRow}>
                                <View style={[styles.badge, { backgroundColor: getStatusColor(detailsData.status || 'pending') }]}>
                                    <Text style={styles.badgeText}>{(detailsData.status || 'PENDING').toUpperCase()}</Text>
                                </View>
                            </View>

                            {/* Employee name */}
                            {selectedItem?.userName ? (
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Name</Text>
                                    <Text style={styles.detailValue}>{selectedItem.userName}</Text>
                                </View>
                            ) : null}

                            {/* Status */}
                            {/* <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Status</Text>
                                <Text style={[styles.detailValue, { color: getStatusColor(detailsData.status || 'pending') }]}>
                                    {detailsData.status || 'Pending'}
                                </Text>
                            </View> */}

                            {/* Manager Transfer Section for Pending Team Flow */}
                            {isPending && (
                                <ApprovalPendingWithSection
                                    managers={managers}
                                    onTransfer={handleTransfer}
                                    isLoading={isTransferring}
                                    currentManagerName={detailsData.approvedByName || detailsData.pendingWith || selectedItem.pendingWith}
                                />
                            )}

                            {/* Applied On */}
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Applied On</Text>
                                <Text style={styles.detailValue}>{formatDate(detailsData.appliedOn)}</Text>
                            </View>

                            {/* Regularization Date */}
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Regularization Date</Text>
                                <Text style={styles.detailValue}>{formatDate(detailsData.regularizedDate)}</Text>
                            </View>

                            {/* Approval Pending With (ReadOnly if not pending) */}
                            {!isPending && (
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>
                                        {
                                            status === 'pending' || status === 'transfer' || status === "withdraw"
                                                ? 'Approval Pending With' : status === "approved" ? 'Approved By'
                                                    : status === 'rejected'
                                                        ? 'Rejected By'
                                                        : 'Reviewed By'
                                        }                                    </Text>
                                    <Text style={styles.detailValue}>{detailsData?.reviewByName || detailsData?.approvedByName}</Text>
                                </View>
                            )}

                            {/* ── Entries Section ── */}
                            <View style={styles.section}>
                                <View style={styles.entriesHeader}>
                                    <Text style={styles.sectionTitle}>
                                        {isPreviousView ? 'Previous Entries' : 'Entries'}
                                    </Text>
                                    <TouchableOpacity
                                        style={styles.toggleBtn}
                                        onPress={handleTogglePreviousEntries}
                                        disabled={loadingPreviousEntries}
                                    >
                                        {loadingPreviousEntries
                                            ? <ActivityIndicator size="small" color="#3b82f6" />
                                            : <Text style={styles.toggleBtnText}>{toggleLabel}</Text>
                                        }
                                    </TouchableOpacity>
                                </View>

                                {rows.length === 0 ? (
                                    <View style={styles.emptyEntries}>
                                        <Text style={styles.emptyEntriesText}>No entries available</Text>
                                    </View>
                                ) : (
                                    rows.map((row, idx) => (
                                        <View key={idx} style={styles.entryPairCard}>
                                            {/* IN entry */}
                                            {row.inEntry && (
                                                <View style={styles.entryRow}>
                                                    <Text style={[styles.entryType, styles.entryIn]}>IN</Text>
                                                    <View style={styles.entryDetails}>
                                                        <Text style={styles.entryTime}>{row.inEntry.time || '-'}</Text>
                                                        <Text style={styles.entrySub}>
                                                            {row.inEntry.workMode || '-'}
                                                            {row.inEntry.location ? `  •  ${row.inEntry.location}` : ''}
                                                        </Text>
                                                    </View>
                                                </View>
                                            )}
                                            {/* OUT entry */}
                                            {row.outEntry && (
                                                <View style={styles.entryRow}>
                                                    <Text style={[styles.entryType, styles.entryOut]}>OUT</Text>
                                                    <View style={styles.entryDetails}>
                                                        <Text style={styles.entryTime}>{row.outEntry.time || '-'}</Text>
                                                        <Text style={styles.entrySub}>
                                                            {row.outEntry.workMode || '-'}
                                                            {row.outEntry.location ? `  •  ${row.outEntry.location}` : ''}
                                                        </Text>
                                                    </View>
                                                </View>
                                            )}
                                            {/* Remarks */}
                                            {row.inEntry?.remarks ? (
                                                <View style={styles.remarksBlock}>
                                                    <Text style={styles.remarksLabel}>Remarks</Text>
                                                    <Text style={styles.remarksValue}>{row.inEntry.remarks}</Text>
                                                </View>
                                            ) : null}
                                        </View>
                                    ))
                                )}
                            </View>

                            {/* ── Approve / Reject actions (Pending only) ── */}
                            {isPending && (
                                <View style={styles.teamActionRow}>
                                    <TouchableOpacity
                                        style={[styles.teamBtn, styles.rejectBtn]}
                                        onPress={() => setShowRejectModal(true)}
                                    >
                                        <Text style={styles.rejectText}>REJECT</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.teamBtn, styles.approveBtn]}
                                        onPress={() => setShowApproveModal(true)}
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? (
                                            <ActivityIndicator size="small" color="#fff" />
                                        ) : (
                                            <Text style={styles.approveText}>APPROVE</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            )}
                        </ScrollView>
                    )}
                </View>

                {/* Approve Confirmation Modal */}
                <WithdrawConfirmationModal
                    visible={showApproveModal}
                    onClose={() => setShowApproveModal(false)}
                    onConfirm={handleApproveConfirm}
                    isLoading={actionLoading}
                    title="Approval Confirmation"
                    message="This employee is not part of your reporting hierarchy. Approving this request will forward it to the administration team. Do you wish to continue?"
                    confirmText="Confirm"
                />

                {/* Reject Confirmation Modal */}
                <WithdrawConfirmationModal
                    visible={showRejectModal}
                    onClose={() => setShowRejectModal(false)}
                    onConfirm={handleRejectConfirm}
                    isLoading={actionLoading}
                    title="Reject Confirmation"
                    message="Are you sure you want to reject this?"
                    confirmText="Confirm"
                />
            </View>

            <LoadingOverlay {...overlay} />
        </Modal>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    card: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '92%',
        minHeight: '50%',
        paddingBottom: 24,
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
        fontSize: 17,
        fontWeight: '700',
        color: '#1f2937',
    },
    closeBtn: {
        padding: 4,
    },
    loaderWrap: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 14,
        color: '#6b7280',
    },
    scrollContent: {
        padding: 16,
    },
    badgeRow: {
        flexDirection: 'row',
        marginBottom: 14,
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 20,
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 11,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#f3f4f6',
    },
    detailLabel: {
        fontSize: 13,
        color: '#6b7280',
        fontWeight: '500',
        flex: 1,
    },
    detailValue: {
        fontSize: 13,
        color: '#1f2937',
        fontWeight: '600',
        flex: 1.5,
        textAlign: 'right',
    },
    section: {
        paddingTop: 14,
    },
    entriesHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 13,
        color: '#6b7280',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    toggleBtn: {
        borderWidth: 1,
        borderColor: '#6092f6',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: '#e8f0fe',
        minWidth: 40,
        alignItems: 'center',
    },
    toggleBtnText: {
        fontSize: 12,
        color: '#3b82f6',
        fontWeight: '600',
    },
    emptyEntries: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    emptyEntriesText: {
        fontSize: 13,
        color: '#9ca3af',
        fontStyle: 'italic',
    },
    entryPairCard: {
        backgroundColor: '#f9fafb',
        borderRadius: 10,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    entryRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 4,
    },
    entryType: {
        width: 38,
        fontSize: 12,
        fontWeight: '800',
    },
    entryIn: {
        color: '#10b981',
    },
    entryOut: {
        color: '#ef4444',
    },
    entryDetails: {
        flex: 1,
    },
    entryTime: {
        fontSize: 13,
        fontWeight: '700',
        color: '#3b82f6',
    },
    entrySub: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 1,
    },
    remarksBlock: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#e5e7eb',
    },
    remarksLabel: {
        fontSize: 11,
        color: '#6b7280',
        fontWeight: '600',
        marginBottom: 2,
    },
    remarksValue: {
        fontSize: 12,
        color: '#374151',
    },
    teamActionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        paddingHorizontal: 10,
        gap: 16,
    },
    teamBtn: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    approveBtn: {
        backgroundColor: '#348beeff',
    },
    rejectBtn: {
        backgroundColor: '#f3f0f0ff',
        borderWidth: 1,
        borderColor: '#f22121ff',
    },
    rejectText: {
        color: '#f22121ff',
        fontWeight: 'bold',
        fontSize: 15,
        letterSpacing: 0.5,
    },
    approveText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 15,
        letterSpacing: 0.5,
    },
});

export default TeamRegularizationModal;
