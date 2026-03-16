import { View, Text, ScrollView, StyleSheet } from 'react-native';
import AppModal from '../common/AppModal';
import CCChips from './CCChips';

const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
        case 'approved': return '#10b981'; // green
        case 'rejected': return '#ef4444'; // red
        case 'pending': return '#f59e0b'; // orange
        default: return '#6b7280'; // gray
    }
};

const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${String(date.getDate()).padStart(2, '0')}-${date.toLocaleString('default', { month: 'short' })}-${date.getFullYear()}`;
};

const HistoryDetailsModal = ({ visible, onClose, detailsData }) => {
    if (!detailsData) return null;

    const isPending = detailsData.status?.toLowerCase() === 'pending';
    const assignedOrReviewed = isPending ? detailsData.assignToName : detailsData.reviewByName;

    return (
        <AppModal
            visible={visible}
            onClose={onClose}
            title="Details"
            heightPercentage="85%"
        >
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Status Badge */}
                <View style={styles.statusBadgeRow}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(detailsData.status) }]}>
                        <Text style={styles.statusBadgeText}>{detailsData.status}</Text>
                    </View>
                </View>

                {/* Applied On */}
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Applied On</Text>
                    <Text style={styles.detailValue}>{formatDisplayDate(detailsData.appliedOn)}</Text>
                </View>

                {/* Approval Pending With OR Reviewed By */}
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{isPending ? 'Approval Pending With' : 'Reviewed By'}</Text>
                    <Text style={styles.detailValue}>{assignedOrReviewed || '-'}</Text>
                </View>

                {/* CC members */}
                {detailsData.ccList && detailsData.ccList.length > 0 && (
                    <View style={styles.sectionBlock}>
                        <Text style={styles.sectionTitle}>CC</Text>
                        <CCChips ccList={detailsData.ccList} />
                    </View>
                )}

                {/* Reason */}
                <View style={styles.reasonBlock}>
                    <Text style={styles.detailLabel}>Reason</Text>
                    <View style={styles.reasonValueBox}>
                        <Text style={styles.reasonValueText}>{detailsData.reason || '-'}</Text>
                    </View>
                </View>
            </ScrollView>
        </AppModal>
    );
};

const styles = StyleSheet.create({
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
});

export default HistoryDetailsModal;
