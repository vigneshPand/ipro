import React, { useEffect, useState, memo, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Platform,
    Dimensions,
    KeyboardAvoidingView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import WFHCheckInConfirmModal from '../../components/common/WFHCheckInConfirmModal';
import Icons from 'react-native-vector-icons/FontAwesome6';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
    runOnJS,
} from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';

import { COLORS, SHADOW } from '../../utils/theme';
import useRegularizationStore from '../../store/useRegularizationStore';
import useAttendanceGridStore from '../../store/useAttendanceGridStore';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const MODE_OPTIONS = ['Home', 'Office', 'Client'];

const ModeDropdown = memo(({ value, onSelect, error }) => {
    const [open, setOpen] = useState(false);

    return (
        <View style={ddStyles.wrapper}>
            <TouchableOpacity
                style={[ddStyles.trigger, error ? ddStyles.triggerError : null]}
                onPress={() => setOpen((v) => !v)}
                activeOpacity={0.8}
            >
                <Text style={[ddStyles.triggerText, !value && ddStyles.placeholder]}>
                    {value || 'Select Mode'}
                </Text>
                <Icon name={open ? 'chevron-up' : 'chevron-down'} size={14} color="#666" />
            </TouchableOpacity>

            {open && (
                <View style={ddStyles.dropdown}>
                    {MODE_OPTIONS.map((opt) => (
                        <TouchableOpacity
                            key={opt}
                            style={[ddStyles.option, value === opt && ddStyles.optionSelected]}
                            onPress={() => {
                                onSelect(opt);
                                setOpen(false);
                            }}
                        >
                            <Text style={[ddStyles.optionText, value === opt && ddStyles.optionTextSelected]}>
                                {opt}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {error ? <Text style={styles.errorMsg}>{error}</Text> : null}
        </View>
    );
});

const ddStyles = StyleSheet.create({
    wrapper: { marginBottom: 8, zIndex: 999 },
    trigger: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: '#fafafa',
    },
    triggerError: { borderColor: '#e53935' },
    triggerText: { fontSize: 14, color: '#333', fontWeight: '500' },
    placeholder: { color: '#aaa' },
    dropdown: {
        position: 'absolute',
        top: 44,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        zIndex: 9999,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
    },
    option: {
        paddingHorizontal: 14,
        paddingVertical: 11,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    optionSelected: { backgroundColor: '#f0f4ff' },
    optionText: { fontSize: 14, color: '#333' },
    optionTextSelected: { color: COLORS.primary, fontWeight: '700' },
});

// ─────────────────────────────────────────────────────────────────────────────
//  Single Row Card (PREMIUM UI PRESERVED, UPDATED PICKER LOGIC)
// ─────────────────────────────────────────────────────────────────────────────
const RowCard = memo(({ row, rowIndex, totalRows, onUpdate, onAdd, onDelete, onOpenPicker }) => {

    return (
        <View style={styles.card}>
            {/* ── Row number badge ── */}
            {/* <View style={styles.cardHeader}>
                <View style={styles.rowBadge}>
                    <Text style={styles.rowBadgeText}>Row {rowIndex + 1}</Text>
                </View>
            </View> */}

            {/* ── Mode ── */}
            <Text style={styles.fieldLabel}>Mode</Text>
            <ModeDropdown
                value={row.mode}
                onSelect={(val) => onUpdate(row.id, 'mode', val)}
                error={row.errors?.mode}
            />

            {/* ── In Time / Out Time (50/50) ── */}
            <View style={styles.timeRow}>
                {/* In Time */}
                <View style={styles.timeCell}>
                    <Text style={styles.fieldLabel}>In Time</Text>
                    <TouchableOpacity
                        style={[styles.timeBtn, row.errors?.inTime ? styles.timeBtnError : null]}
                        onPress={() => onOpenPicker('in', row.id, row.inTime)}
                        activeOpacity={0.8}
                    >
                        <Icon name="time-outline" size={14} color="#888" style={styles.timeIcon} />
                        <Text style={[styles.timeBtnText, !row.inTime && styles.timePlaceholder]}>
                            {row.inTime || '--:-- --'}
                        </Text>
                    </TouchableOpacity>
                    {row.errors?.inTime ? <Text style={styles.errorMsg}>{row.errors.inTime}</Text> : null}
                </View>

                {/* Out Time */}
                <View style={[styles.timeCell, styles.timeCellRight]}>
                    <Text style={styles.fieldLabel}>Out Time</Text>
                    <TouchableOpacity
                        style={[styles.timeBtn, row.errors?.outTime ? styles.timeBtnError : null]}
                        onPress={() => onOpenPicker('out', row.id, row.outTime)}
                        activeOpacity={0.8}
                    >
                        <Icon name="time-outline" size={14} color="#888" style={styles.timeIcon} />
                        <Text style={[styles.timeBtnText, !row.outTime && styles.timePlaceholder]}>
                            {row.outTime || '--:-- --'}
                        </Text>
                    </TouchableOpacity>
                    {row.errors?.outTime ? <Text style={styles.errorMsg}>{row.errors.outTime}</Text> : null}
                </View>
            </View>

            {/* ── Remarks ── */}
            <Text style={styles.fieldLabel}>Remarks</Text>
            <TextInput
                style={[styles.remarksInput, row.errors?.remarks ? styles.remarksInputError : null]}
                placeholder="Enter remarks"
                placeholderTextColor="#aaa"
                value={row.remarks}
                onChangeText={(v) => onUpdate(row.id, 'remarks', v)}
                multiline
                numberOfLines={2}
            />
            {row.errors?.remarks ? <Text style={styles.errorMsg}>{row.errors.remarks}</Text> : null}

            {/* ── Action Icons ── */}
            <View style={styles.cardActions}>
                {rowIndex > 0 && (
                    <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => onDelete(row.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Icons name="trash" size={16} color="#e53935" />
                    </TouchableOpacity>
                )}
                {/* + only on last row */}
                {rowIndex === totalRows - 1 && (
                    <TouchableOpacity
                        style={styles.addBtn}
                        onPress={onAdd}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Icon name="add" size={18} color="#fff" />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
});

const NoticePopup = memo(({ visible, message, onOk, isSuccess }) => {
    if (!visible) return null;

    const iconName = isSuccess ? "circle-check" : "triangle-exclamation";
    const iconColor = isSuccess ? "#2e7d32" : "#e65100";
    const bg = isSuccess ? "#e8f5e9" : "#fff8e1";
    const title = isSuccess ? "Success" : "Notice";

    return (
        <Modal transparent visible={visible} animationType="fade">
            <View style={popupStyles.overlay}>
                <View style={popupStyles.card}>
                    <View style={[popupStyles.iconBg, { backgroundColor: bg }]}>
                        <Icons name={iconName} size={26} color={iconColor} />
                    </View>
                    <Text style={popupStyles.title}>{title}</Text>
                    <Text style={popupStyles.message}>{message}</Text>
                    <TouchableOpacity style={[popupStyles.btn, isSuccess && { backgroundColor: '#2e7d32' }]} onPress={onOk} activeOpacity={0.8}>
                        <Text style={popupStyles.btnText}>Understood</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
});

const popupStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 320,
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
    },
    iconBg: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#fff8e1',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
        marginBottom: 8,
    },
    message: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    btn: {
        backgroundColor: COLORS.primary,
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
    },
    btnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
});

// Specific backend error that should redirect the user to apply WFH instead.
const WFH_REDIRECT_ERROR = 'Initial office work hours less than shift required office hours';

const RegularizationEditModal = ({
    visible,
    onClose,
    date,       // "YYYY-MM-DD"
    userId,
    headerLabel, // e.g. "Edit – 09 Mar 2026"
    onSubmitSuccess,
    navigation, // required for WFH redirect flow
}) => {
    const translateY = useSharedValue(SCREEN_HEIGHT);
    const [renderModal, setRenderModal] = useState(false);

    const rows = useRegularizationStore(state => state.rows);
    const loading = useRegularizationStore(state => state.loading);
    // const fetchError = useRegularizationStore(state => state.fetchError);
    const fetchAndPrefill = useRegularizationStore(state => state.fetchAndPrefill);
    const updateRow = useRegularizationStore(state => state.updateRow);
    const addRow = useRegularizationStore(state => state.addRow);
    const deleteRow = useRegularizationStore(state => state.deleteRow);
    const warningMessage = useRegularizationStore(state => state.warningMessage);
    const checkShiftTimingWarning = useRegularizationStore(state => state.checkShiftTimingWarning);

    // ── Submit State ──
    const submitting = useRegularizationStore(state => state.submitting);
    const submitMessage = useRegularizationStore(state => state.submitMessage);
    const submitSuccess = useRegularizationStore(state => state.submitSuccess);
    const submitRegularization = useRegularizationStore(state => state.submitRegularization);
    const resetState = useRegularizationStore(state => state.resetState);

    // ── Global Native Picker State ──
    const [pickerVisible, setPickerVisible] = useState(false);
    const [activeRowId, setActiveRowId] = useState(null);
    const [activeField, setActiveField] = useState(null); // 'inTime' | 'outTime'
    const [pickerValue, setPickerValue] = useState(new Date());

    // ── WFH Redirect Popup State ──
    const [wfhRedirectVisible, setWfhRedirectVisible] = useState(false);
    const [isHiddenForNav, setIsHiddenForNav] = useState(false);

    // ── Slide-in / slide-out animation ──
    useEffect(() => {
        if (visible) {
            setRenderModal(true);
            translateY.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) });
        } else {
            translateY.value = withTiming(
                SCREEN_HEIGHT,
                { duration: 250, easing: Easing.in(Easing.ease) },
                (finished) => { if (finished) runOnJS(setRenderModal)(false); },
            );
        }
    }, [visible, translateY]);

    // ── Fetch on open ──
    useEffect(() => {
        if (visible && date && userId) {
            fetchAndPrefill(date, userId);
        }
    }, [visible, date, userId, fetchAndPrefill]);

    // ── Overlay Messaging (Warning & Submit) ──
    const [popupVisible, setPopupVisible] = useState(false);
    const currentMessage = submitMessage || warningMessage;

    useEffect(() => {
        if (currentMessage) setPopupVisible(true);
        else setPopupVisible(false);
    }, [currentMessage]);

    const handlePopupOk = useCallback(() => {
        setPopupVisible(false);

        if (submitMessage) {
            useRegularizationStore.setState({ submitMessage: null });
            if (submitSuccess) {
                // Success case: close models
                resetState();
                if (onSubmitSuccess) {
                    onSubmitSuccess();
                } else {
                    handleClose();
                }
            }
        } else if (warningMessage) {
            useRegularizationStore.setState({ warningMessage: null });
        }
    }, [submitMessage, warningMessage, submitSuccess, onSubmitSuccess, resetState, handleClose]);

    // ── Handle Submit Button ──
    const handleSubmit = async () => {
        if (submitting) return; // Prevent rapid double-clicks

        const result = await submitRegularization(date, userId);

        // ── WFH Redirect: Home mode + 400 + specific backend message ──
        // Check if ANY row has mode 'Home' (multi-row support)
        const hasHomeMode = rows.some(r => r.mode === 'Home');
        if (
            !result.success &&
            hasHomeMode &&
            result.status === 400 &&
            result.message?.includes(WFH_REDIRECT_ERROR)
        ) {
            // Suppress the normal error notice popup and show WFH redirect popup.
            useRegularizationStore.setState({ submitMessage: null, submitSuccess: false });
            setWfhRedirectVisible(true);
            return;
        }

        // Refresh grid after submit regardless of success or failure
        useAttendanceGridStore.getState().fetchCalendarStatus(userId);
    };

    // ── WFH Redirect Handlers ──
    const handleConfirmWFH = useCallback(() => {
        setWfhRedirectVisible(false);
        setIsHiddenForNav(true); // Hide current native modal to prevent overlap
        if (navigation) {
            navigation.navigate('LeaveApply', {
                leaveType: 'Work From Home',
                balance: null,
                prefilledDate: date, // "YYYY-MM-DD" — prefills fromDate & toDate
                onReturnToRegularization: () => {
                    setIsHiddenForNav(false); // Restore modal visibility on return
                }
            });
        }
    }, [navigation, date]);

    const handleDismissWFH = useCallback(() => {
        setWfhRedirectVisible(false);
        // Stay in regularization modal — no other state changes needed
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    const handleClose = useCallback(() => {
        useRegularizationStore.setState({ warningMessage: null });
        translateY.value = withTiming(
            SCREEN_HEIGHT,
            { duration: 250, easing: Easing.in(Easing.ease) },
            (finished) => { if (finished) runOnJS(onClose)(); },
        );
    }, [onClose, translateY]);

    // ── Global Picker Handlers ──
    const openPicker = useCallback((type, rowId, currentValue) => {
        setActiveRowId(rowId);
        setActiveField(type === 'in' ? 'inTime' : 'outTime');

        // Parse current string value to Date for the picker
        let initialDate = new Date();
        if (currentValue) {
            const [timePart, ampm] = currentValue.split(' ');
            let [hours, minutes] = timePart.split(':').map(n => parseInt(n, 10));
            if (ampm === 'PM' && hours < 12) hours += 12;
            if (ampm === 'AM' && hours === 12) hours = 0;
            initialDate.setHours(hours, minutes, 0, 0);
        }
        setPickerValue(initialDate);
        setPickerVisible(true);
    }, []);

    const formatTimeForUI = (selectedDate) => {
        let hours = selectedDate.getHours();
        const minutes = String(selectedDate.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12; // convert to 12h format
        return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
    };

    const handlePickerChange = (event, selectedDate) => {
        if (Platform.OS === 'android') {
            setPickerVisible(false);
        }

        if (event.type === 'set' && selectedDate && activeRowId && activeField) {
            updateRow(activeRowId, activeField, formatTimeForUI(selectedDate));
            setTimeout(() => {
                checkShiftTimingWarning(date, userId);
            }, 100);
        }
    };

    const renderItem = useCallback(({ item, index }) => (
        <RowCard
            row={item}
            rowIndex={index}
            totalRows={rows.length}
            onUpdate={updateRow}
            onAdd={addRow}
            onDelete={deleteRow}
            onOpenPicker={openPicker}
        />
    ), [rows.length, updateRow, addRow, deleteRow, openPicker]);

    const keyExtractor = useCallback((item) => String(item.id), []);

    if (!renderModal && !visible) return null;

    return (
        <Modal
            transparent
            visible={renderModal && !isHiddenForNav}
            animationType="fade"
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity
                    style={StyleSheet.absoluteFill}
                    onPress={onClose}
                />

                <KeyboardAvoidingView style={{ width: '100%' }}>
                    <Animated.View style={[styles.sheet, animatedStyle]}>

                        <View style={styles.header}>
                            <Text style={styles.headerTitle} numberOfLines={1}>
                                {headerLabel || 'Edit Regularization'}
                            </Text>
                            <View style={styles.headerButtons}>
                                <TouchableOpacity style={styles.hdrCancelBtn} onPress={onClose}>
                                    <Text style={styles.hdrCancelText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.hdrSubmitBtn, submitting && { opacity: 0.7 }]}
                                    onPress={handleSubmit}
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Text style={styles.hdrSubmitText}>Submit</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={styles.header}>
                            <Icons name="circle-exclamation" size={15} color={COLORS.yellow} />
                            <Text style={styles.headerTitle1}>
                                Attendance Regularizationin only available for the past one week. It will be revieded by the manager and admin within 7 days of this action occuring.
                            </Text>
                        </View>

                        {loading ? (
                            <ActivityIndicator />
                        ) : (
                            <Animated.FlatList
                                data={rows}
                                renderItem={renderItem}
                                keyExtractor={keyExtractor}
                                initialNumToRender={5}
                                windowSize={7}
                                maxToRenderPerBatch={5}
                                removeClippedSubviews
                                keyboardShouldPersistTaps="handled"
                            />
                        )}

                    </Animated.View>
                </KeyboardAvoidingView>
            </View>

            {/* ── Global Native Time Picker ── */}
            {pickerVisible && (
                <DateTimePicker
                    value={pickerValue}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handlePickerChange}
                />
            )}

            {/* ── Custom Notice Popup ── */}
            <NoticePopup
                visible={popupVisible}
                message={currentMessage}
                isSuccess={!!(submitMessage && submitSuccess)}
                onOk={handlePopupOk}
            />

            {/* ── WFH Redirect Confirmation Popup ── */}
            <WFHCheckInConfirmModal
                visible={wfhRedirectVisible}
                onClose={handleDismissWFH}
                onConfirm={handleConfirmWFH}
            />
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'flex-end',
    },
    kavWrapper: {
        width: '100%',
    },
    sheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 20,
        paddingHorizontal: 16,
        paddingBottom: 32,
        maxHeight: SCREEN_HEIGHT * 0.75,
        minHeight: SCREEN_HEIGHT * 0.65,
        ...SHADOW,
    },
    flatListContent: {
        paddingBottom: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.primary,
        flex: 1,
        marginRight: 8,
    },
    headerTitle1: {
        fontSize: 12,
        fontWeight: '500',
        color: '#b4923cff',
        flex: 1,
        marginLeft: 8,
        marginRight: 8,
    },
    headerButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    hdrCancelBtn: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#ed6868ff',
        backgroundColor: '#f5f5f5ff',
    },
    hdrCancelText: {
        fontSize: 13,
        color: '#666',
        fontWeight: '600',
    },
    hdrSubmitBtn: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
        backgroundColor: COLORS.primary,
    },
    hdrSubmitText: {
        fontSize: 13,
        color: '#fff',
        fontWeight: '600',
    },
    closeBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#f5f5f5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    centered: {
        paddingVertical: 36,
        alignItems: 'center',
        gap: 10,
    },
    statusText: {
        fontSize: 13,
        color: '#888',
        marginTop: 6,
    },

    // Row Card
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#ededf0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 6,
        elevation: 3,
        overflow: Platform.OS === 'android' ? 'visible' : 'visible',
        zIndex: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    rowBadge: {
        backgroundColor: '#f0f4ff',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 3,
    },
    rowBadgeText: {
        fontSize: 11,
        color: COLORS.primary,
        fontWeight: '700',
    },
    fieldLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#555',
        marginBottom: 5,
    },
    timeRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    timeCell: {
        flex: 1,
    },
    timeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 10,
        backgroundColor: '#fafafa',
    },
    timeBtnError: {
        borderColor: '#e53935',
    },
    timeBtnText: {
        fontSize: 13,
        color: '#333',
        fontWeight: '500',
    },
    timePlaceholder: {
        color: '#aaa',
    },
    remarksInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 9,
        fontSize: 13,
        color: '#333',
        backgroundColor: '#fafafa',
        textAlignVertical: 'top',
        marginBottom: 8,
        minHeight: 56,
    },
    remarksInputError: {
        borderColor: '#e53935',
    },
    errorMsg: {
        fontSize: 11,
        color: '#e53935',
        marginTop: 3,
        marginBottom: 4,
        marginLeft: 2,
    },
    cardActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 10,
        marginTop: 4,
    },
    addBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#ffebee',
        alignItems: 'center',
        justifyContent: 'center',
    },
    timeIcon: {
        marginRight: 6,
    },
    timeCellRight: {
        marginLeft: 10,
    },
    headerIcon: {
        marginRight: 8,
    },
});

export default RegularizationEditModal;
