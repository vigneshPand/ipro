import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SHADOW } from '../../utils/theme';
import useRegularizationHistoryStore from '../../store/useRegularizationHistoryStore';
import WithdrawConfirmationModal from '../leave/WithdrawConfirmationModal';
import LoadingOverlay from '../LoadingOverlay';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return `${String(d.getDate()).padStart(2, '0')}-${d.toLocaleString('default', { month: 'short' })}-${d.getFullYear()}`;
};

const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
        case 'approved': return COLORS.statusApproved;
        case 'rejected': return COLORS.statusRejected;
        case 'pending': return COLORS.statusPending;
        case 'withdrawn':
        case 'withdraw': return COLORS.statusWithdraw;
        default: return COLORS.statusDefault;
    }
};

/**
 * Converts the flat regularizationRecords array into display pairs.
 * currStatus: true = IN, false = OUT
 * Groups them in order: collects consecutive IN/OUT pairs.
 */
const buildEntryRows = (records = []) => {
    if (!records || records.length === 0) return [];
    const rows = [];
    let i = 0;
    while (i < records.length) {
        const curr = records[i];
        const isIn = curr.currStatus === true;
        if (isIn) {
            const next = records[i + 1];
            const isNextOut = next && next.currStatus === false;
            rows.push({
                inEntry: curr,
                outEntry: isNextOut ? next : null,
            });
            i += isNextOut ? 2 : 1;
        } else {
            // orphan OUT
            rows.push({ inEntry: null, outEntry: curr });
            i++;
        }
    }
    return rows;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionDivider = ({ title }) => (
    <View style={styles.sectionDividerRow}>
        <Text style={styles.sectionDividerText}>{title}</Text>
    </View>
);

const DetailRow = ({ label, value }) => (
    <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value || '-'}</Text>
    </View>
);

const EntryRow = ({ entry, type }) => {
    if (!entry) {
        return (
            <View style={styles.entryRow}>
                <Text style={[styles.entryType, type === 'IN' ? styles.entryTypeIn : styles.entryTypeOut]}>
                    {type}
                </Text>
                <Text style={styles.entryMode}>-</Text>
                <Text style={styles.entryTime}>-</Text>
            </View>
        );
    }
    return (
        <View style={styles.entryRow}>
            <Text style={[styles.entryType, type === 'IN' ? styles.entryTypeIn : styles.entryTypeOut]}>
                {type}
            </Text>
            <Text style={styles.entryMode} numberOfLines={1}>{entry.workMode || '-'}</Text>
            <Text style={styles.entryTime}>{entry.time || '-'}</Text>
        </View>
    );
};

const EntriesSection = ({ records, title = 'Entries' }) => {
    const rows = buildEntryRows(records);

    if (!records || records.length === 0) {
        return (
            <View style={styles.entriesBlock}>
                <SectionDivider title={title} />
                <View style={styles.emptyEntriesContainer}>
                    <Text style={styles.emptyEntriesText}>No entries are available</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.entriesBlock}>
            <SectionDivider title={title} />
            {rows.map((row, idx) => (
                <View key={idx} style={styles.entryPairCard}>
                    {/* IN row */}
                    <EntryRow entry={row.inEntry} type="IN" />
                    {/* OUT row */}
                    <EntryRow entry={row.outEntry} type="OUT" />
                    {/* Remarks from IN entry (if any) */}
                    {row.inEntry?.remarks ? (
                        <View style={styles.remarksRow}>
                            <Text style={styles.remarksLabel}>Remarks: </Text>
                            <Text style={styles.remarksValue}>{row.inEntry.remarks}</Text>
                        </View>
                    ) : null}
                </View>
            ))}
        </View>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const RegularizationDetailsCard = ({ showWithdraw = false, onWithdrawSuccess }) => {
    const {
        selectedItem,
        detailsData,
        loadingDetails,
        previousEntries,
        isPreviousView,
        loadingPreviousEntries,
        fetchPreviousEntries,
        refreshDetails,
        withdrawRegularization,
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
        const res = await withdrawRegularization(requestId);
        setIsWithdrawing(false);
        setShowWithdrawModal(false);

        if (res.success) {
            showSuccess(res.message, () => {
                hideOverlay();
                if (onWithdrawSuccess) onWithdrawSuccess();
            });
        } else {
            showError(res.message);
        }
    };

    // ── Empty / No Selection ──────────────────────────────────────────────────
    if (!selectedItem) {
        return (
            <View style={styles.emptySelectionContainer}>
                <Icon name="clipboard-text-outline" size={52} color="#d1d5db" />
                <Text style={styles.emptySelectionText}>Select a record to view details</Text>
            </View>
        );
    }

    // ── Loading ───────────────────────────────────────────────────────────────
    if (loadingDetails) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.blue} />
            </View>
        );
    }

    // ── No Details ────────────────────────────────────────────────────────────
    if (!detailsData) {
        return (
            <View style={styles.emptySelectionContainer}>
                <Icon name="alert-circle-outline" size={52} color="#d1d5db" />
                <Text style={styles.emptySelectionText}>No details available</Text>
            </View>
        );
    }

    // ── Determine which entries to show ───────────────────────────────────────
    const entriesToShow = isPreviousView
        ? previousEntries || []
        : detailsData.regularizationRecords || [];

    const toggleButtonLabel = isPreviousView ? 'See Updated Entries' : 'See Previous Entries';

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* ── Status Badge ── */}
                <View style={styles.statusBadgeRow}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(detailsData.status) }]}>
                        <Text style={styles.statusBadgeText}>{detailsData.status || '-'}</Text>
                    </View>
                </View>

                {/* ── Header Details ── */}
                <View style={styles.detailsCard}>
                    <DetailRow label="Applied On" value={formatDisplayDate(detailsData.appliedOn)} />
                    <DetailRow label="Regularization Date" value={formatDisplayDate(detailsData.regularizedDate)} />
                    <DetailRow
                        label="Approval Pending With"
                        value={detailsData.approvedByName || '-'}
                    />
                </View>

                {/* ── Entries Section ── */}
                {loadingPreviousEntries ? (
                    <View style={styles.entriesLoadingContainer}>
                        <ActivityIndicator size="small" color={COLORS.blue} />
                        <Text style={styles.entriesLoadingText}>Loading entries...</Text>
                    </View>
                ) : (
                    <EntriesSection
                        records={entriesToShow}
                        title={isPreviousView ? 'Previous Entries' : 'Entries'}
                    />
                )}

                {/* ── Toggle Previous Entries ── */}
                <TouchableOpacity
                    style={styles.toggleEntriesBtn}
                    onPress={handleTogglePreviousEntries}
                    disabled={loadingPreviousEntries}
                    activeOpacity={0.7}
                >
                    <Icon
                        name={isPreviousView ? 'history' : 'clock-outline'}
                        size={15}
                        color={COLORS.blue}
                        style={styles.toggleIcon}
                    />
                    <Text style={styles.toggleEntriesText}>{toggleButtonLabel}</Text>
                </TouchableOpacity>

                {/* ── Withdraw Button (Pending only) ── */}
                {showWithdraw && (
                    <View style={styles.withdrawRow}>
                        <TouchableOpacity
                            style={styles.withdrawBtn}
                            onPress={() => setShowWithdrawModal(true)}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.withdrawBtnText}>WITHDRAW</Text>
                        </TouchableOpacity>
                    </View>
                )}

            </ScrollView>

            {/* Withdraw Modal */}
            <WithdrawConfirmationModal
                visible={showWithdrawModal}
                onClose={() => setShowWithdrawModal(false)}
                onConfirm={handleWithdraw}
                isLoading={isWithdrawing}
            />

            {/* Loading Overlay */}
            <LoadingOverlay {...overlay} />
        </View>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        ...SHADOW,
        margin: 12,
        overflow: 'hidden',
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 32,
    },

    // ── Empty / Loading ───────────────────────────────────────────────────────
    emptySelectionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptySelectionText: {
        marginTop: 12,
        fontSize: 14,
        color: COLORS.grayText,
        textAlign: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // ── Status Badge ──────────────────────────────────────────────────────────
    statusBadgeRow: {
        flexDirection: 'row',
        marginBottom: 14,
    },
    statusBadge: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    // ── Details Card ──────────────────────────────────────────────────────────
    detailsCard: {
        backgroundColor: '#f9fafb',
        borderRadius: 10,
        paddingHorizontal: 14,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#e5e7eb',
    },
    detailLabel: {
        fontSize: 13,
        color: COLORS.grayText,
        fontWeight: '500',
        flex: 1,
    },
    detailValue: {
        fontSize: 13,
        color: COLORS.darkText,
        fontWeight: '600',
        flex: 1.5,
        textAlign: 'right',
    },

    // ── Section Divider ───────────────────────────────────────────────────────
    sectionDividerRow: {
        backgroundColor: COLORS.blue,
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginBottom: 10,
        alignSelf: 'flex-start',
    },
    sectionDividerText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    // ── Entries Block ─────────────────────────────────────────────────────────
    entriesBlock: {
        marginBottom: 10,
    },
    emptyEntriesContainer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    emptyEntriesText: {
        fontSize: 13,
        color: COLORS.grayText,
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
        letterSpacing: 0.5,
    },
    entryTypeIn: {
        color: COLORS.statusApproved,
    },
    entryTypeOut: {
        color: COLORS.statusRejected,
    },
    entryMode: {
        flex: 1,
        fontSize: 13,
        color: COLORS.darkText,
        fontWeight: '500',
    },
    entryTime: {
        fontSize: 13,
        color: COLORS.blue,
        fontWeight: '700',
        minWidth: 50,
        textAlign: 'right',
    },
    remarksRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 6,
        paddingTop: 6,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#e5e7eb',
    },
    remarksLabel: {
        fontSize: 12,
        color: COLORS.grayText,
        fontWeight: '600',
    },
    remarksValue: {
        fontSize: 12,
        color: COLORS.darkText,
        flex: 1,
    },

    // ── Entries Loading ───────────────────────────────────────────────────────
    entriesLoadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
    },
    entriesLoadingText: {
        marginLeft: 10,
        fontSize: 13,
        color: COLORS.grayText,
    },

    // ── Toggle Entries Button ─────────────────────────────────────────────────
    toggleEntriesBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: COLORS.blue,
        marginTop: 4,
        marginBottom: 16,
    },
    toggleEntriesText: {
        color: COLORS.blue,
        fontSize: 13,
        fontWeight: '700',
    },
    toggleIcon: {
        marginRight: 6,
    },

    // ── Withdraw ──────────────────────────────────────────────────────────────
    withdrawRow: {
        alignItems: 'flex-end',
        marginTop: 8,
    },
    withdrawBtn: {
        backgroundColor: COLORS.red,
        paddingVertical: 10,
        paddingHorizontal: 28,
        borderRadius: 6,
    },
    withdrawBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
        letterSpacing: 0.5,
    },
});

export default RegularizationDetailsCard;
