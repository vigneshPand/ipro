import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet, ActivityIndicator, Image, Alert, Share } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import useLeaveStore from '../../store/useLeaveStore';
import useTeamLeaveStore from '../../store/useTeamLeaveStore';
import useManagerStore from '../../store/useManagerStore';
import WithdrawConfirmationModal from './WithdrawConfirmationModal';
import AuthService from '../../services/AuthService';
import LoadingOverlay from '../LoadingOverlay';
import LeaveAttachmentService from '../../services/LeaveAttachmentService';
import ApprovalPendingWithSection from './ApprovalPendingWithSection';
import { formatMinutesToTime } from '../../utils/dateUtils';

const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
        case 'approved': return '#10b981'; // green
        case 'rejected': return '#ef4444'; // red
        case 'pending': return '#f59e0b'; // orange
        case 'withdraw': return '#e4b5edff'; // purple
        default: return '#6b7280'; // gray
    }
};

const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${String(date.getDate()).padStart(2, '0')}-${date.toLocaleString('default', { month: 'short' })}-${date.getFullYear()}`;
};

const LeaveHistoryDetailsModal = ({ visible, onClose, showWithdraw, onWithdrawSuccess, onTransferSuccess, isWFH = false, externalLeaveDetails, externalLoadingDetails }) => {
    const leaveStore = useLeaveStore();
    const teamLeaveStore = useTeamLeaveStore();
    const selectedLeaveDetails = externalLeaveDetails !== undefined ? externalLeaveDetails : leaveStore.selectedLeaveDetails;
    const loadingLeaveDetails = externalLoadingDetails !== undefined ? externalLoadingDetails : leaveStore.loadingLeaveDetails;
    const { managers, fetchManagers } = useManagerStore();
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const [isTransferring, setIsTransferring] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const [isApproving, setIsApproving] = useState(false);
    const [selectedManagerId, setSelectedManagerId] = useState(null);
    const isTeamFlow = externalLeaveDetails !== undefined;

    const [overlay, setOverlay] = useState({
        visible: false,
        message: '',
        type: 'loading',
        onConfirm: null,
        onCancel: null
    });

    // Attachment view/download states
    const [viewImageModal, setViewImageModal] = useState(false);
    const [viewedImage, setViewedImage] = useState(null);
    const [loadingViewIndex, setLoadingViewIndex] = useState(null);
    const [loadingDownloadIndex, setLoadingDownloadIndex] = useState(null);

    const hideOverlay = useCallback(() => setOverlay(prev => ({ ...prev, visible: false })), []);
    const showSuccess = useCallback((message, onConfirm = hideOverlay) => setOverlay({ visible: true, message, type: 'success', onConfirm }), [hideOverlay]);
    const showError = useCallback((message) => setOverlay({ visible: true, message, type: 'error', onConfirm: hideOverlay }), [hideOverlay]);

    // Fetch managers when modal opens in team flow
    useEffect(() => {
        if (visible && isTeamFlow) {
            AuthService.getUserInfo().then(user => {
                if (user?.userId) {
                    fetchManagers(user.userId);
                }
            });
        }
    }, [visible, isTeamFlow, fetchManagers]);

    // Reset overlay state when modal visibility changes to prevent stale popups
    useEffect(() => {
        if (!visible) {
            setOverlay({ visible: false, message: '', type: 'loading', onConfirm: null, onCancel: null });
            setShowWithdrawModal(false);
            setViewImageModal(false);
            setViewedImage(null);
            setLoadingDownloadIndex(null);
            setIsTransferring(false);
        }
    }, [visible]);

    // ─── Handle View Attachment ───
    const handleViewAttachment = useCallback(async (attachmentIndex) => {
        setLoadingViewIndex(attachmentIndex);
        try {
            const requestId = selectedLeaveDetails?.id || selectedLeaveDetails?.requestId;
            if (!requestId) {
                Alert.alert('Error', 'Unable to retrieve request ID');
                setLoadingViewIndex(null);
                return;
            }

            const base64Image = await LeaveAttachmentService.viewAttachment(requestId, attachmentIndex);
            setViewedImage(base64Image);
            setViewImageModal(true);
        } catch (error) {
            Alert.alert('Error', error?.message || 'Failed to load attachment');
            console.error('View attachment error:', error);
        } finally {
            setLoadingViewIndex(null);
        }
    }, [selectedLeaveDetails]);

    // ─── Handle Download Attachment ───
    const handleDownloadAttachment = useCallback(async (attachmentIndex, fileName) => {
        setLoadingDownloadIndex(attachmentIndex);
        try {
            const requestId = selectedLeaveDetails?.id || selectedLeaveDetails?.requestId;
            if (!requestId) {
                Alert.alert('Error', 'Unable to retrieve request ID');
                setLoadingDownloadIndex(null);
                return;
            }

            const result = await LeaveAttachmentService.downloadAttachment(
                requestId,
                attachmentIndex,
                fileName
            );

            if (result?.success) {
                showSuccess(result.message || 'File downloaded successfully', hideOverlay);
            }
        } catch (error) {
            console.error('Download attachment error:', error);
            showError(error?.message || 'Failed to download attachment');
        } finally {
            setLoadingDownloadIndex(null);
        }
    }, [selectedLeaveDetails, showSuccess, showError, hideOverlay]);


    const handleWithdraw = async (remarks) => {
        setIsWithdrawing(true);
        const requestId = selectedLeaveDetails?.id || selectedLeaveDetails?.requestId;
        const leaveId = selectedLeaveDetails?.leaveId || (selectedLeaveDetails?.days && selectedLeaveDetails.days[0]?.leaveId) || 0;
        const session = (selectedLeaveDetails?.days && selectedLeaveDetails.days[0]?.session) || "Full Day";

        const res = await leaveStore.withdrawLeave(requestId, leaveId, session, remarks);

        setIsWithdrawing(false);

        if (res.success) {
            setShowWithdrawModal(false); // Close withdraw modal immediately
            showSuccess(res.message, () => {
                hideOverlay();
                onClose();
            });

            // Refresh pending list via parent callback or fallback to leave store
            if (onWithdrawSuccess) {
                onWithdrawSuccess();
            } else {
                try {
                    const user = await AuthService.getUserInfo();
                    if (user?.userId) {
                        await leaveStore.fetchPendingLeaves(user.userId, new Date().getFullYear());
                    }
                } catch (err) {
                    // console.error('Refresh error', err);
                }
            }
        } else {
            setShowWithdrawModal(false);
            showError(res.message);
        }
    };

    const handleApprove = async () => {
        setIsApproving(true);
        const requestId = selectedLeaveDetails?.leaveId || selectedLeaveDetails?.id || selectedLeaveDetails?.requestId;

        try {
            let managerId = selectedManagerId;
            if (!managerId) {
                const user = await AuthService.getUserInfo();
                managerId = user?.userId;
            }

            const res = await teamLeaveStore.approveLeave(requestId, managerId);
            setIsApproving(false);

            if (res.success) {
                showSuccess(res.message || "Leave request Approved Successfully", () => {
                    hideOverlay();
                    onClose();

                    if (onTransferSuccess) {
                        onTransferSuccess();
                    } else if (isTeamFlow) {
                        AuthService.getUserInfo().then(userInfo => {
                            const mail = userInfo?.mail || userInfo?.email;
                            if (mail) {
                                teamLeaveStore.fetchPendingLeaves(mail, new Date().getFullYear());
                            }
                        });
                    }
                });
            } else {
                showError(res.message);
            }
        } catch (error) {
            setIsApproving(false);
            showError("Failed to approve leave request");
        }
    };

    const handleReject = async (remarks) => {
        setIsRejecting(true);
        const requestId = selectedLeaveDetails?.leaveId || selectedLeaveDetails?.id || selectedLeaveDetails?.requestId;

        try {
            let managerId = selectedManagerId;
            if (!managerId) {
                const user = await AuthService.getUserInfo();
                managerId = user?.userId;
            }

            const res = await teamLeaveStore.rejectLeave(requestId, managerId, remarks);
            setIsRejecting(false);
            setShowWithdrawModal(false);

            if (res.success) {
                showSuccess("Leave request Rejected Successfully", () => {
                    hideOverlay();
                    onClose();

                    if (onTransferSuccess) {
                        onTransferSuccess();
                    } else if (isTeamFlow) {
                        AuthService.getUserInfo().then(userInfo => {
                            const mail = userInfo?.mail || userInfo?.email;
                            if (mail) {
                                teamLeaveStore.fetchPendingLeaves(mail, new Date().getFullYear());
                            }
                        });
                    }
                });
            } else {
                setShowWithdrawModal(false);
                showError(res.message);
            }
        } catch (error) {
            setIsRejecting(false);
            setShowWithdrawModal(false);
            showError("Failed to reject leave request");
        }
    };

    const handleTransfer = async (managerId) => {
        setIsTransferring(true);
        const requestId = selectedLeaveDetails?.leaveId || selectedLeaveDetails?.id || selectedLeaveDetails?.requestId;

        try {
            const res = await teamLeaveStore.transferLeave(requestId, managerId);
            setIsTransferring(false);
            if (res.success) {
                showSuccess("Leave request Transferred Successfully", () => {
                    hideOverlay();
                    onClose();

                    if (onTransferSuccess) {
                        onTransferSuccess();
                    } else if (isTeamFlow) {
                        // Fallback: manually fetch if no callback provided
                        AuthService.getUserInfo().then(userInfo => {
                            const mail = userInfo?.mail || userInfo?.email;
                            if (mail) {
                                teamLeaveStore.fetchPendingLeaves(mail, new Date().getFullYear());
                            }
                        });
                    }
                });
            } else {
                showError(res.message);
            }
        } catch (error) {
            setIsTransferring(false);
            showError("Failed to transfer leave request");
        }
    };

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
                        <Text style={styles.headerTitle}>Leave Details</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Icon name="close" size={24} color="#374151" />
                        </TouchableOpacity>
                    </View>

                    {loadingLeaveDetails ? (
                        <View style={styles.loaderContainer}>
                            <ActivityIndicator size="large" color="#3b82f6" />
                            {/* <Text style={styles.loadingText}>Loading details...</Text> */}
                        </View>
                    ) : !selectedLeaveDetails ? (
                        <View style={styles.loaderContainer}>
                            <Text style={styles.loadingText}>No details available</Text>
                        </View>
                    ) : (
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                            {/* Status Badge */}
                            <View style={styles.statusBadgeRow}>
                                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedLeaveDetails.status) }]}>
                                    <Text style={styles.statusBadgeText}>{selectedLeaveDetails.status}</Text>
                                </View>
                            </View>

                            {/* Employee Name */}
                            {externalLeaveDetails !== undefined && (selectedLeaveDetails.userName || selectedLeaveDetails.name) && (
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Employee Name</Text>
                                    <Text style={styles.detailValue}>{selectedLeaveDetails.userName || selectedLeaveDetails.name}</Text>
                                </View>
                            )}

                            {/* Manager Transfer Section for Team Flow */}
                            {isTeamFlow && selectedLeaveDetails.status?.toLowerCase() === 'pending' && (
                                <ApprovalPendingWithSection
                                    managers={managers}
                                    onTransfer={handleTransfer}
                                    onManagerSelect={(id) => setSelectedManagerId(id)}
                                    isLoading={isTransferring}
                                    currentManagerName={selectedLeaveDetails.reviewByName}
                                />
                            )}

                            {isWFH && (
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Request Id</Text>
                                    <Text style={styles.detailValue}>{selectedLeaveDetails.id}</Text>
                                </View>
                            )}
                            {/* Leave Type */}
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Leave Type</Text>
                                <Text style={styles.detailValue}>{selectedLeaveDetails.type}</Text>
                            </View>

                            {/* Applied On */}
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Applied On</Text>
                                <Text style={styles.detailValue}>{formatDisplayDate(selectedLeaveDetails.appliedOn)}</Text>
                            </View>

                            {/* No of Days */}
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>{selectedLeaveDetails.type === 'Permission' ? 'No of Hours' : 'No of Days'}</Text>
                                <Text style={styles.detailValue}>
                                    {selectedLeaveDetails.type === 'Permission' ? formatMinutesToTime(selectedLeaveDetails.noOfDays * 60) : selectedLeaveDetails.noOfDays}
                                </Text>
                            </View>

                            {/* Reviewed By */}
                            {showWithdraw && (
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>
                                        {selectedLeaveDetails.status?.toLowerCase() === 'pending' ? 'Approval Pending ' : 'Reviewed By'}
                                    </Text>
                                    <Text style={styles.detailValue}>{selectedLeaveDetails.reviewByName || 'N/A'}</Text>
                                </View>
                            )}

                            {/* Leave Dates / Duration */}
                            {selectedLeaveDetails.days && selectedLeaveDetails.days.length > 0 && (
                                <View style={styles.sectionBlock}>
                                    <Text style={styles.sectionTitle}>Duration</Text>
                                    {externalLeaveDetails !== undefined ? (
                                        // Team flow: Show date range format
                                        <Text style={styles.durationRange}>
                                            {formatDisplayDate(selectedLeaveDetails.days[0].date)} - {formatDisplayDate(selectedLeaveDetails.days[selectedLeaveDetails.days.length - 1].date)}
                                        </Text>
                                    ) : (
                                        // Employee flow: Show individual days with sessions
                                        selectedLeaveDetails.days.map((day, index) => (
                                            <View key={index} style={styles.dayRow}>
                                                <Text style={styles.dayDate}>{formatDisplayDate(day.date)}</Text>
                                                <View style={styles.sessionBadge}>
                                                    <Text style={styles.sessionBadgeText}>{day.session}</Text>
                                                </View>
                                            </View>
                                        ))
                                    )}
                                </View>
                            )}

                            {/* Reason */}
                            <View style={styles.reasonBlock}>
                                <Text style={styles.detailLabel}>Reason</Text>
                                <View style={styles.reasonValueBox}>
                                    <Text style={styles.reasonValueText}>{selectedLeaveDetails.reason || 'N/A'}</Text>
                                </View>
                            </View>

                            {/* Withdraw reason */}
                            {!showWithdraw && externalLeaveDetails == undefined && (
                                <View style={styles.reasonBlock}>
                                    <Text style={styles.detailLabel}>Withdraw Comments</Text>
                                    <View style={styles.reasonValueBox}>
                                        <Text style={styles.reasonValueText}>{selectedLeaveDetails.withdrawComment || 'N/A'}</Text>
                                    </View>
                                </View>
                            )}
                            {/* CC Members */}
                            {selectedLeaveDetails.cc && selectedLeaveDetails.cc.length > 0 && (
                                <View style={styles.sectionBlock}>
                                    <Text style={styles.sectionTitle}>CC</Text>
                                    <View style={styles.ccContainer}>
                                        {selectedLeaveDetails.cc.map((person, index) => (
                                            <View key={index} style={styles.ccBadge}>
                                                <Text style={styles.ccBadgeText}>{person}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {/* Attachments */}
                            <View style={styles.sectionBlock}>
                                <Text style={styles.sectionTitle}>Attachments</Text>
                                {selectedLeaveDetails.attachments && selectedLeaveDetails.attachments.length > 0 ? (
                                    selectedLeaveDetails.attachments.map((att, index) => (
                                        <View key={index} style={styles.attachmentRow}>
                                            <View style={styles.attachmentNameContainer}>
                                                <Icon name="paperclip" size={16} color="#3b82f6" />
                                                <Text style={styles.attachmentName}>{att.name || att.fileName || `Attachment ${index + 1}`}</Text>
                                            </View>
                                            <View style={styles.attachmentActions}>
                                                {/* View Icon */}
                                                <TouchableOpacity
                                                    style={styles.attachmentActionBtn}
                                                    onPress={() => handleViewAttachment(index)}
                                                    disabled={loadingViewIndex === index}
                                                >
                                                    {loadingViewIndex === index ? (
                                                        <ActivityIndicator size="small" color="#3b82f6" />
                                                    ) : (
                                                        <Icon name="eye" size={18} color="#3b82f6" />
                                                    )}
                                                </TouchableOpacity>

                                                {/* Download Icon */}
                                                <TouchableOpacity
                                                    style={styles.attachmentActionBtn}
                                                    onPress={() => handleDownloadAttachment(index, att.name || att.fileName)}
                                                    disabled={loadingDownloadIndex === index}
                                                >
                                                    {loadingDownloadIndex === index ? (
                                                        <ActivityIndicator size="small" color="#10b981" />
                                                    ) : (
                                                        <Icon name="download" size={18} color="#10b981" />
                                                    )}
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ))
                                ) : (
                                    <Text style={styles.noAttachmentText}>No attachments</Text>
                                )}
                            </View>

                            {/* Withdraw Button if Pending Tab */}
                            {showWithdraw && (
                                <View style={styles.footerActionRow}>
                                    <TouchableOpacity style={styles.withdrawBtn} onPress={() => setShowWithdrawModal(true)}>
                                        <Text style={styles.withdrawBtnText}>WITHDRAW</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* Approve/Reject Buttons if Team Flow & Pending */}
                            {isTeamFlow && selectedLeaveDetails.status?.toLowerCase() === 'pending' && (
                                <View style={styles.teamActionRow}>
                                    <TouchableOpacity
                                        style={[styles.teamBtn, styles.rejectBtn]}
                                        onPress={() => {
                                            setIsWithdrawing(false); // Ensure we're in reject mode
                                            setShowWithdrawModal(true);
                                        }}
                                    >
                                        <Text style={styles.rejectText}>REJECT</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.teamBtn, styles.approveBtn]}
                                        onPress={handleApprove}
                                        disabled={isApproving}
                                    >
                                        {isApproving ? (
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

                {/* Confirmation Modal — Reused for Withdraw and Reject */}
                <WithdrawConfirmationModal
                    visible={showWithdrawModal}
                    onClose={() => setShowWithdrawModal(false)}
                    onConfirm={!showWithdraw ? handleReject : handleWithdraw}
                    isLoading={isWithdrawing || isRejecting}
                    title={!showWithdraw ? "Reject Confirmation" : "Withdraw Confirmation"}
                    message={!showWithdraw ? "Are you sure you want to reject this ?" : "Are you sure you want to withdraw this request?"}
                    confirmText="Confirm"
                />

                <LoadingOverlay {...overlay} />

                {/* Image View Modal */}
                <Modal
                    visible={viewImageModal}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setViewImageModal(false)}
                >
                    <View style={styles.imageModalOverlay}>
                        <View style={styles.imageModalContent}>
                            <TouchableOpacity
                                style={styles.imageCloseBtn}
                                onPress={() => setViewImageModal(false)}
                            >
                                <Icon name="close" size={28} color="#fff" />
                            </TouchableOpacity>

                            {viewedImage ? (
                                <Image
                                    source={{ uri: `data:image/png;base64,${viewedImage}` }}
                                    style={styles.viewedImage}
                                    resizeMode='contain'
                                />
                            ) : (
                                <ActivityIndicator size="large" color="#3b82f6" />
                            )}
                        </View>
                    </View>
                </Modal>
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
        maxHeight: '85%',
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
        borderBottomWidth: 1,
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
    dayRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        borderRadius: 8,
        padding: 10,
        marginBottom: 6,
    },
    dayDate: {
        fontSize: 13,
        color: '#1f2937',
        fontWeight: '500',
    },
    sessionBadge: {
        backgroundColor: '#e0e7ff',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    sessionBadgeText: {
        fontSize: 11,
        color: '#4338ca',
        fontWeight: '600',
    },
    reasonBlock: {
        paddingVertical: 12,
        borderBottomWidth: 1,
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
    noAttachmentText: {
        fontSize: 13,
        color: '#9ca3af',
        fontStyle: 'italic',
    },
    attachmentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 10,
        backgroundColor: '#f9fafb',
        borderRadius: 8,
        marginBottom: 6,
    },
    attachmentNameContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    attachmentName: {
        marginLeft: 8,
        fontSize: 13,
        color: '#374151',
        fontWeight: '500',
    },
    attachmentActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    attachmentActionBtn: {
        padding: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageModalContent: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    imageCloseBtn: {
        position: 'absolute',
        top: 40,
        right: 20,
        zIndex: 10,
        padding: 8,
    },
    viewedImage: {
        width: '100%',
        height: '100%',
    },
    footerActionRow: {
        marginTop: 20,
        marginBottom: 10,
        alignItems: 'flex-end',
    },
    withdrawBtn: {
        backgroundColor: '#d32f2f', // Red matching screenshot
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
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
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

export default LeaveHistoryDetailsModal;
