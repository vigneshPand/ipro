import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import useLeaveStore from '../../store/useLeaveStore';
import WithdrawConfirmationModal from './WithdrawConfirmationModal';
import AuthService from '../../services/AuthService';
import LoadingOverlay from '../LoadingOverlay';

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

const LeaveHistoryDetailsModal = ({ visible, onClose, showWithdraw, onWithdrawSuccess, isWFH = false }) => {
    const { selectedLeaveDetails, loadingLeaveDetails, withdrawLeave, fetchPendingLeaves } = useLeaveStore();
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [isWithdrawing, setIsWithdrawing] = useState(false);

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

    // Reset overlay state when modal visibility changes to prevent stale popups
    React.useEffect(() => {
        if (!visible) {
            setOverlay({ visible: false, message: '', type: 'loading', onConfirm: null, onCancel: null });
            setShowWithdrawModal(false);
        }
    }, [visible]);


    const handleWithdraw = async (remarks) => {
        setIsWithdrawing(true);
        const requestId = selectedLeaveDetails?.id || selectedLeaveDetails?.requestId;
        const leaveId = selectedLeaveDetails?.leaveId || (selectedLeaveDetails?.days && selectedLeaveDetails.days[0]?.leaveId) || 0;
        const session = (selectedLeaveDetails?.days && selectedLeaveDetails.days[0]?.session) || "Full Day";

        const res = await withdrawLeave(requestId, leaveId, session, remarks);
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
                        await fetchPendingLeaves(user.userId, new Date().getFullYear());
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

    // The withdraw button logic is now purely based on the tab context passed down via 'showWithdraw'

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
                                <Text style={styles.detailLabel}>No of Days</Text>
                                <Text style={styles.detailValue}>{selectedLeaveDetails.noOfDays}</Text>
                            </View>

                            {/* Reviewed By */}
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Approval Pending With</Text>
                                <Text style={styles.detailValue}>{selectedLeaveDetails.reviewByName || 'N/A'}</Text>
                            </View>

                            {/* Leave Dates */}
                            {selectedLeaveDetails.days && selectedLeaveDetails.days.length > 0 && (
                                <View style={styles.sectionBlock}>
                                    <Text style={styles.sectionTitle}>Duration</Text>
                                    {selectedLeaveDetails.days.map((day, index) => (
                                        <View key={index} style={styles.dayRow}>
                                            <Text style={styles.dayDate}>{formatDisplayDate(day.date)}</Text>
                                            <View style={styles.sessionBadge}>
                                                <Text style={styles.sessionBadgeText}>{day.session}</Text>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {/* Reason */}
                            <View style={styles.reasonBlock}>
                                <Text style={styles.detailLabel}>Reason</Text>
                                <View style={styles.reasonValueBox}>
                                    <Text style={styles.reasonValueText}>{selectedLeaveDetails.reason || 'N/A'}</Text>
                                </View>
                            </View>

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
                                        <TouchableOpacity key={index} style={styles.attachmentBtn}>
                                            <Icon name="paperclip" size={16} color="#3b82f6" />
                                            <Text style={styles.attachmentText}>{att.fileName || `Attachment ${index + 1}`}</Text>
                                        </TouchableOpacity>
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

                        </ScrollView>
                    )}
                </View>

                {/* Withdraw Confirmation Modal */}
                <WithdrawConfirmationModal
                    visible={showWithdrawModal}
                    onClose={() => setShowWithdrawModal(false)}
                    onConfirm={handleWithdraw}
                    isLoading={isWithdrawing}
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
    attachmentBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
    },
    attachmentText: {
        marginLeft: 6,
        color: '#3b82f6',
        fontSize: 14,
        fontWeight: '500',
    },
    noAttachmentText: {
        fontSize: 13,
        color: '#9ca3af',
        fontStyle: 'italic',
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
});

export default LeaveHistoryDetailsModal;
