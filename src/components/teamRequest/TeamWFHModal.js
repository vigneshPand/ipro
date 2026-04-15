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
        const remarks = '';
        const res = await approveRequest(selectedItem?.id, managerUserId, remarks);
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
        const res = await rejectRequest(selectedItem?.id, managerUserId, remarks);
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
        const res = await transferRequest(selectedItem?.id, managerId);
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
                                <View style={[styles.badge, { backgroundColor: getStatusColor(detailsData.status || selectedItem?.status || 'pending') }]}>
                                    <Text style={styles.badgeText}>{(detailsData.status || selectedItem?.status || 'PENDING').toUpperCase()}</Text>
                                </View>
                            </View>

                            {/* Employee name */}
                            {detailsData.userName || selectedItem?.userName ? (
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Employee Name</Text>
                                    <Text style={styles.detailValue}>{detailsData.userName || selectedItem?.userName}</Text>
                                </View>
                            ) : null}

                            {/* Manager Transfer Section for Pending Team Flow */}
                            {isPending && (
                                <ApprovalPendingWithSection
                                    managers={managers}
                                    onTransfer={handleTransfer}
                                    isLoading={isTransferring}
                                    currentManagerName={detailsData.reviewByName || detailsData.approvedByName || detailsData.pendingWith || selectedItem?.pendingWith}
                                />
                            )}

                            {/* Leave Type */}
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Leave Type</Text>
                                <Text style={styles.detailValue}>{detailsData.type || 'Work From Home'}</Text>
                            </View>

                            {/* Applied On */}
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Applied On</Text>
                                <Text style={styles.detailValue}>{formatDate(detailsData.appliedOn)}</Text>
                            </View>

                            {/* No of Days */}
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>No of Days</Text>
                                <Text style={styles.detailValue}>{detailsData.noOfDays || selectedItem?.noOfDays}</Text>
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
                                    <Text style={styles.detailValue}>{detailsData?.reviewByName || 'N/A'}</Text>
                                </View>
                            )}

                            {/* Dates / Duration */}
                            {detailsData.days && detailsData.days.length > 0 && (
                                <View style={styles.sectionBlock}>
                                    <Text style={styles.sectionTitle}>Duration</Text>
                                    <Text style={styles.durationRange}>
                                        {formatDate(detailsData.days[0].date)} - {formatDate(detailsData.days[detailsData.days.length - 1].date)}
                                    </Text>
                                </View>
                            )}

                            {/* Reason */}
                            <View style={styles.reasonBlockContainer}>
                                <Text style={styles.detailLabel}>Reason</Text>
                                <View style={styles.reasonValueBox}>
                                    <Text style={styles.reasonValueText}>{detailsData.reason || 'N/A'}</Text>
                                </View>
                            </View>

                            {/* CC Members */}
                            {detailsData.cc && detailsData.cc.length > 0 && (
                                <View style={styles.sectionBlock}>
                                    <Text style={styles.sectionTitle}>CC</Text>
                                    <View style={styles.ccContainer}>
                                        {detailsData.cc.map((person, index) => (
                                            <View key={index} style={styles.ccBadge}>
                                                <Text style={styles.ccBadgeText}>{person}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}


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
    detailValue: { fontSize: 14, color: '#1f2937', fontWeight: '600', flex: 1.5, textAlign: 'right' },
    sectionBlock: {
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#f3f4f6',
    },
    sectionTitle: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '600',
        marginBottom: 8,
    },
    durationRange: {
        fontSize: 14,
        color: '#1f2937',
        fontWeight: '500',
        marginTop: 4,
    },
    reasonBlockContainer: {
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#f3f4f6',
    },
    reasonValueBox: {
        marginTop: 8,
        backgroundColor: '#f9fafb',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    reasonValueText: {
        fontSize: 14,
        color: '#374151',
        lineHeight: 20,
    },
    ccContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    ccBadge: {
        backgroundColor: '#fef3c7',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    ccBadgeText: {
        fontSize: 12,
        color: '#92400e',
        fontWeight: '500',
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
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rejectBtn: {
        backgroundColor: '#f3f0f0ff',
        borderWidth: 1,
        borderColor: '#f22121ff',
    },
    approveBtn: {
        backgroundColor: '#348beeff',
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

export default TeamWFHModal;
