import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import useCompOffStore from '../../../store/useCompOffStore';
import CCChips from '../../../components/leave/CCChips';

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

const CompOffDetailsModal = ({ visible, onClose, detailsData, type }) => {
    const { loadingLeaveDetails } = useCompOffStore();

    if (!visible) return null;

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
                        <Text style={styles.headerTitle}>Comp-Off Details</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Icon name="close" size={24} color="#374151" />
                        </TouchableOpacity>
                    </View>

                    {loadingLeaveDetails ? (
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
                                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(detailsData?.grantStatus) }]}>
                                    <Text style={styles.statusBadgeText}>{detailsData?.grantStatus}</Text>
                                </View>
                            </View>

                            {/* Applied On */}
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Applied On</Text>
                                <Text style={styles.detailValue}>
                                    {formatDisplayDate(detailsData.grantCreationDate)}
                                </Text>
                            </View>

                            {/* Reviewed By / Pending With */}
                            {type === 'pending' ? (
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>
                                        {detailsData?.grantStatus?.toLowerCase() === 'pending' ? 'Approval Pending With' : 'Reviewed By'}
                                    </Text>
                                    <Text style={styles.detailValue}>
                                        {detailsData?.grantStatus?.toLowerCase() === 'pending'
                                            ? (detailsData.assignedToName || detailsData.assignToName || '-')
                                            : (detailsData.reviewedByName || detailsData.reviewByName || '-')}
                                    </Text>
                                </View>
                            ) : (
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>
                                        Reviewed By
                                    </Text>
                                    <Text style={styles.detailValue}>
                                        {detailsData?.reviewedByName ? detailsData?.reviewedByName : 'Not yet reviewed'}
                                    </Text>
                                </View>
                            )}

                            {/* Reason */}
                            <View style={styles.reasonBlock}>
                                <Text style={styles.detailLabel}>Reason</Text>
                                <View style={styles.reasonValueBox}>
                                    <Text style={styles.reasonValueText}>{detailsData?.currentStatusReason || '-'}</Text>
                                </View>
                            </View>

                            {/* CC Members */}
                            {detailsData.ccList && detailsData.ccList.length > 0 && (
                                <View style={styles.sectionBlock}>
                                    <Text style={styles.sectionTitle}>CC</Text>
                                    <CCChips ccList={detailsData.ccList} />
                                </View>
                            )}

                        </ScrollView>
                    )}
                </View>
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
    }
});

export default CompOffDetailsModal;
