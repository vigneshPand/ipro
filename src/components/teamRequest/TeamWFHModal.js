/**
 * TeamWFHModal
 * ──────────────────────────────────────────────────────────────────────
 * Manager-flow detail modal for WFH requests.
 * Mirrors TeamRegularizationModal but is simpler (no entries/previous toggle).
 *
 * Props
 * ─────────────────────────────────────────────────────────────────────
 * visible          boolean
 * onClose          () => void
 * store            useTeamWFHStore instance
 * managerUserId    number
 * isPending        boolean
 * onActionSuccess  () => void
 */

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

// ─── Component ────────────────────────────────────────────────────────────────

const TeamWFHModal = ({
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
        approveRequest,
        rejectRequest,
        transferRequest,
        clearSelectedDetails,
    } = store();

    const { managers, fetchManagers } = useManagerStore();

    const [showRejectModal, setShowRejectModal] = useState(false);
    const [actionLoading, setActionLoading]     = useState(false);
    const [isTransferring, setIsTransferring]   = useState(false);
    const [overlay, setOverlay]                 = useState({
        visible: false, message: '', type: 'loading', onConfirm: null, onCancel: null,
    });

    const hideOverlay = useCallback(() => setOverlay(prev => ({ ...prev, visible: false })), []);
    const showSuccess = useCallback((msg, onConfirm = hideOverlay) => setOverlay({ visible: true, message: msg, type: 'success', onConfirm }), [hideOverlay]);
    const showError   = useCallback((msg) => setOverlay({ visible: true, message: msg, type: 'error', onConfirm: hideOverlay }), [hideOverlay]);

    useEffect(() => {
        if (visible) {
            AuthService.getUserInfo().then(user => {
                if (user?.userId) {
                    fetchManagers(user.userId);
                }
            });
        }
    }, [visible, fetchManagers]);

    useEffect(() => {
        if (!visible) {
            setShowRejectModal(false);
            setOverlay({ visible: false, message: '', type: 'loading', onConfirm: null, onCancel: null });
            setIsTransferring(false);
        }
    }, [visible]);

    const handleApprove = async () => {
        if (!selectedItem || !managerUserId) return;
        setActionLoading(true);
        const res = await approveRequest(selectedItem.requestId, managerUserId);
        setActionLoading(false);
        if (res.success) {
            showSuccess(res.message || 'Approved Successfully', () => {
                hideOverlay();
                clearSelectedDetails();
                onClose();
                if (onActionSuccess) onActionSuccess();
            });
        } else {
            showError(res.message || 'Something went wrong');
            if (onActionSuccess) onActionSuccess();
        }
    };

    const handleReject = async (remarks) => {
        if (!selectedItem || !managerUserId) return;
        setActionLoading(true);
        const res = await rejectRequest(selectedItem.requestId, managerUserId, remarks);
        setActionLoading(false);
        setShowRejectModal(false);
        if (res.success) {
            showSuccess(res.message || 'Rejected Successfully', () => {
                hideOverlay();
                clearSelectedDetails();
                onClose();
                if (onActionSuccess) onActionSuccess();
            });
        } else {
            showError(res.message || 'Something went wrong');
            if (onActionSuccess) onActionSuccess();
        }
    };

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

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.card}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>WFH Request Details</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Icon name="close" size={24} color="#374151" />
                        </TouchableOpacity>
                    </View>

                    {/* Body */}
                    {loadingDetails ? (
                        <View style={styles.loaderWrap}>
                            <ActivityIndicator size="large" color="#0ea5e9" />
                        </View>
                    ) : !detailsData ? (
                        <View style={styles.loaderWrap}>
                            <Icon name="home-account" size={40} color="#d1d5db" />
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
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Status</Text>
                                <Text style={[styles.detailValue, { color: getStatusColor(detailsData.status || 'pending') }]}>
                                    {detailsData.status || 'Pending'}
                                </Text>
                            </View>

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

                            {/* WFH Date */}
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>WFH Date</Text>
                                <Text style={styles.detailValue}>{formatDate(detailsData.startDate || detailsData.date)}</Text>
                            </View>

                            {/* Approval Pending With (ReadOnly if not pending) */}
                            {!isPending && (
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Approved By</Text>
                                    <Text style={styles.detailValue}>{detailsData.approvedByName || detailsData.pendingWith || '-'}</Text>
                                </View>
                            )}

                            {/* Reason */}
                            {detailsData.reason ? (
                                <View style={styles.reasonBlock}>
                                    <Text style={styles.reasonLabel}>Reason</Text>
                                    <Text style={styles.reasonValue}>{detailsData.reason}</Text>
                                </View>
                            ) : null}

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
                                        onPress={handleApprove}
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

                {/* Confirmation Modal — Reused for Reject */}
                <WithdrawConfirmationModal
                    visible={showRejectModal}
                    onClose={() => setShowRejectModal(false)}
                    onConfirm={handleReject}
                    isLoading={actionLoading}
                    title="Reject Confirmation"
                    message="Are you sure you want to reject this ?"
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
        maxHeight: '90%',
        minHeight: '45%',
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
    closeBtn: { padding: 4 },
    loaderWrap: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
        gap: 10,
    },
    emptyText: { fontSize: 14, color: '#6b7280' },
    scrollContent: { padding: 16 },
    badgeRow: { flexDirection: 'row', marginBottom: 14 },
    badge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
    badgeText: { color: '#fff', fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 11,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#f3f4f6',
    },
    detailLabel: { fontSize: 13, color: '#6b7280', fontWeight: '500', flex: 1 },
    detailValue: { fontSize: 13, color: '#1f2937', fontWeight: '600', flex: 1.5, textAlign: 'right' },
    reasonBlock: {
        backgroundColor: '#f0f9ff',
        borderRadius: 8,
        padding: 12,
        marginTop: 14,
        borderLeftWidth: 3,
        borderLeftColor: '#0ea5e9',
    },
    reasonLabel: { fontSize: 11, color: '#0369a1', fontWeight: '700', marginBottom: 4, textTransform: 'uppercase' },
    reasonValue: { fontSize: 13, color: '#0c4a6e' },
    teamActionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        paddingHorizontal: 10,
        gap: 16,
    },
    teamBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    approveBtn: { backgroundColor: '#10b981' },
    rejectBtn:  { backgroundColor: '#ef4444' },
    approveText: { color: '#fff', fontWeight: 'bold', fontSize: 13, letterSpacing: 0.5 },
    rejectText: { color: '#fff', fontWeight: 'bold', fontSize: 13, letterSpacing: 0.5 },
});

export default TeamWFHModal;
