import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AuthService from '../../services/AuthService';
import LeaveService from '../../services/LeaveService';
import AttachFilePicker from '../../components/AttachFilePicker';
import DatePickerField from '../../components/leave/DatePickerField';
import HalfDaySelector from '../../components/leave/HalfDaySelector';
import ReportsToSection from '../../components/leave/ReportsToSection';
import useLeaveRequestStore from '../../store/useLeaveRequestStore';
import useLeaveStore from '../../store/useLeaveStore';
import { COLORS } from '../../utils/theme';

// Helper: format Date to YYYY-MM-DD for API calls
const formatToAPI = (date) => {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

// Helper: parse YYYY-MM-DD safely into a local Date object without UTC overlap
const parseAPIDate = (dateStr) => {
    const [y, m, d] = dateStr.split('-');
    return new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
};

// Helper: format Date for display (e.g. "5-Mar-2026")
const formatDate = (date) => {
    return `${date.getDate()}-${date.toLocaleString('default', { month: 'short' })}-${date.getFullYear()}`;
};

const LeaveApplyScreen = ({ navigation, route }) => {
    const { leaveType, balance } = route.params;

    // Date state
    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);

    // Session state
    const [selectedSessions, setSelectedSessions] = useState({});

    // Form state
    const [reason, setReason] = useState('');
    const [managerInfo, setManagerInfo] = useState({ name: 'Loading...', profile: null });
    const [noOfDays, setNoOfDays] = useState(0);

    // Bereavement state
    const [bereavementTypes, setBereavementTypes] = useState([]);
    const [selectedBereavementType, setSelectedBereavementType] = useState(null);
    const [showBereavementDropdown, setShowBereavementDropdown] = useState(false);

    // Validation API state
    const [validDatesMap, setValidDatesMap] = useState({});
    const [validationError, setValidationError] = useState(null);
    const [isValidatingDates, setIsValidatingDates] = useState(false);
    const validationTimer = useRef(null);

    // POST API state from Zustand
    const { isSubmitting, submitLeaveRequest } = useLeaveRequestStore();

    // ─── Load manager info on mount ───
    useEffect(() => {
        const loadManager = async () => {
            try {
                const userInfo = await AuthService.getUserInfo();
                if (userInfo && userInfo.reportTo) {
                    setManagerInfo({
                        name: userInfo.reportTo.displayName || 'Manager',
                        profile: userInfo.reportTo.profile,
                        designation: userInfo.reportTo.designation || 'Manager'
                    });
                }
            } catch (error) {
                console.warn('Failed to load manager info', error);
            }
        };
        loadManager();
    }, []);

    // ─── Fetch Bereavement Types ───
    useEffect(() => {
        if (leaveType !== 'Bereavement Leave') return;
        const fetchBereavementTypes = async () => {
            try {
                const types = await LeaveService.getBereavementLeaveTypes();
                setBereavementTypes(types);
            } catch (error) {
                console.log('Failed to load bereavement types', error);
            }
        };
        fetchBereavementTypes();
    }, [leaveType]);

    // ─── Reset fields on Bereavement Type Change ───
    useEffect(() => {
        if (leaveType === 'Bereavement Leave') {
            setToDate(null);
            setValidDatesMap({});
            setValidationError(null);
            setSelectedSessions({});

            // Clear loading state and any pending validation if user changes dropdown
            setIsValidatingDates(false);
            if (validationTimer.current) {
                clearTimeout(validationTimer.current);
                validationTimer.current = null;
            }
        }
    }, [selectedBereavementType, leaveType]);

    // ─── Reset stale data + validate dates via API (debounced 300ms) ───
    useEffect(() => {
        if (validationTimer.current) {
            clearTimeout(validationTimer.current);
            validationTimer.current = null;
        }

        // Reset stale session data immediately
        setValidDatesMap({});
        setValidationError(null);
        setSelectedSessions({});

        // Only call API when both dates are selected and valid
        if (!fromDate || !toDate || formatToAPI(toDate) < formatToAPI(fromDate)) {
            setIsValidatingDates(false);
            return;
        }

        if (leaveType === 'Bereavement Leave' && !selectedBereavementType) {
            setValidationError('Please select bereavement type first');
            setIsValidatingDates(false);
            return;
        }

        // Debounce the API call (300ms)
        setIsValidatingDates(true);
        validationTimer.current = setTimeout(async () => {
            try {
                const userInfo = await AuthService.getUserInfo();
                const userId = userInfo?.userId;

                const apiParams = {
                    from: formatToAPI(fromDate),
                    to: formatToAPI(toDate),
                    userId,
                    leaveType,
                };

                if (leaveType === 'Bereavement Leave' && selectedBereavementType) {
                    apiParams.bereavementLeaveType = selectedBereavementType.id;
                }

                const result = await LeaveService.getValidLeaveDates(apiParams);

                if (Array.isArray(result)) {
                    const map = {};
                    const initialSessions = {};
                    result.forEach((item) => {
                        map[item.date] = item.sessionTypes;
                        if (item.sessionTypes && item.sessionTypes.length > 0) {
                            initialSessions[item.date] = item.sessionTypes[0];
                        }
                    });
                    setValidDatesMap(map);
                    setSelectedSessions(initialSessions);
                }
            } catch (error) {
                setValidationError(error.message || 'Validation failed');
                setValidDatesMap({});
            } finally {
                setIsValidatingDates(false);
            }
        }, 300);

        return () => {
            if (validationTimer.current) {
                clearTimeout(validationTimer.current);
                validationTimer.current = null;
            }
        };
    }, [fromDate, toDate, leaveType, selectedBereavementType]);

    // ─── Calculate number of days ───
    useEffect(() => {
        if (!fromDate || !toDate) {
            setNoOfDays(0);
            return;
        }

        const start = new Date(fromDate);
        const end = new Date(toDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);

        const diffTime = end.getTime() - start.getTime();
        if (diffTime < 0) {
            setNoOfDays(0);
            return;
        }

        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        const dateKeys = Object.keys(validDatesMap);
        if (dateKeys.length > 0 && Object.keys(selectedSessions).length > 0) {
            let total = 0;
            dateKeys.forEach(dateStr => {
                const session = selectedSessions[dateStr];
                if (session === 'Full Day') total += 1;
                else if (session) total += 0.5;
            });
            setNoOfDays(total);
            return;
        }

        setNoOfDays(Math.max(diffDays, 0));
    }, [fromDate, toDate, validDatesMap, selectedSessions]);

    // ─── Derived values ───
    const hasValidSessions = Object.keys(validDatesMap).length > 0;
    const isBalanceLow = validationError ? true : (leaveType !== 'Bereavement Leave' && fromDate && toDate && noOfDays > balance);

    // ─── Build leaveDates payload from validDatesMap + user selections ───
    const buildLeaveDatesPayload = () => {
        const dateKeys = Object.keys(validDatesMap).sort();
        return dateKeys.map((dateKey) => {
            const session = selectedSessions[dateKey] || 'Full Day';
            return { date: dateKey, session };
        });
    };

    // ─── Handle Apply ───
    const handleApply = async () => {
        if (isBalanceLow || isSubmitting) return;
        if (!fromDate || !toDate) {
            Alert.alert('Error', 'Please select From and To dates');
            return;
        }
        if (leaveType === 'Bereavement Leave' && !selectedBereavementType) {
            Alert.alert('Error', 'Please select a bereavement type');
            return;
        }
        if (!reason.trim()) {
            Alert.alert('Error', 'Please enter a reason');
            return;
        }
        if (!hasValidSessions) {
            Alert.alert('Error', 'Please wait for date validation to complete');
            return;
        }

        try {
            const userInfo = await AuthService.getUserInfo();
            const userId = userInfo?.userId;
            const leaveDatesPayload = buildLeaveDatesPayload();

            const payload = {
                reason: reason.trim(),
                type: leaveType,
                userId,
                leaveDates: JSON.stringify(leaveDatesPayload),
            };

            if (leaveType === 'Bereavement Leave' && selectedBereavementType) {
                payload.bereavementLeaveType = selectedBereavementType.id;
            }

            console.log('payload', payload);

            await submitLeaveRequest(payload);

            // Refresh leave balances so LeaveRequest screen updates immediately
            const { fetchLeaveBalances } = useLeaveStore.getState();
            fetchLeaveBalances(userId, new Date().getFullYear());

            Alert.alert('Success', 'Leave request submitted successfully');
            navigation.goBack();
        } catch (error) {
            Alert.alert(
                'Error',
                error?.response?.data?.message || 'Unable to submit leave request'
            );
        }
    };

    // ─── Date change handlers ───
    const handleFromDateChange = (date) => {
        setFromDate(date);

        if (leaveType === 'Bereavement Leave') {
            if (toDate && date > toDate) setToDate(null);
        } else {
            if (!toDate || date > toDate) setToDate(date);
        }
    };

    const handleToDateChange = (date) => {
        setToDate(date);
    };

    const isDateDisabled = leaveType === 'Bereavement Leave' && !selectedBereavementType;

    return (
        <SafeAreaView style={styles.modalBackground}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
                <View style={styles.modalCard}>

                    {/* Header */}
                    <View style={styles.headerRow}>
                        <Text style={styles.headerText}>Leave Apply</Text>
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <Icon name="close-circle-outline" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                        {/* Top Info Bar */}
                        <View style={styles.infoBar}>
                            <Text style={styles.infoText}>Leave Type : <Text style={styles.infoTextBold}>{leaveType}</Text></Text>
                            {leaveType !== 'Bereavement Leave' && leaveType !== 'Loss Of Pay' && (
                                <Text style={styles.infoText}> Balance: <Text style={styles.infoTextBold}>{balance ?? 0}</Text></Text>
                            )}
                        </View>

                        {/* Bereavement Dropdown */}
                        {leaveType === 'Bereavement Leave' && (
                            <View style={styles.bereavementContainer}>
                                <Text style={[styles.label, styles.mb6]}>
                                    Bereavement Type<Text style={styles.asterisk}>*</Text>
                                </Text>
                                <View style={[styles.dropdownContainer, styles.zIndex20]}>
                                    <TouchableOpacity
                                        style={styles.bereavementDropdownButton}
                                        onPress={() => setShowBereavementDropdown(!showBereavementDropdown)}
                                    >
                                        <Text style={styles.bereavementDropdownButtonText}>
                                            {selectedBereavementType ? selectedBereavementType.bereavementLeaveType : 'Select Type'}
                                        </Text>
                                        <Icon name="menu-down" size={20} color={COLORS.darkText} />
                                    </TouchableOpacity>
                                    {showBereavementDropdown && (
                                        <View style={styles.bereavementDropdownList}>
                                            {bereavementTypes.map((type) => (
                                                <TouchableOpacity
                                                    key={type.id.toString()}
                                                    style={styles.dropdownOption}
                                                    onPress={() => {
                                                        setSelectedBereavementType(type);
                                                        setShowBereavementDropdown(false);
                                                    }}
                                                >
                                                    <Text style={styles.dropdownOptionText}>{type.bereavementLeaveType}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            </View>
                        )}

                        <View style={styles.divider} />

                        {/* Date Picker Row */}
                        <View style={styles.dateRow}>
                            <DatePickerField
                                label="From"
                                date={fromDate}
                                onDateChange={handleFromDateChange}
                                minimumDate={new Date()}
                                formatDate={formatDate}
                                disabled={isDateDisabled}
                            />
                            <DatePickerField
                                label="To"
                                date={toDate}
                                onDateChange={handleToDateChange}
                                minimumDate={fromDate || new Date()}
                                formatDate={formatDate}
                                disabled={isDateDisabled}
                            />
                        </View>

                        {isDateDisabled && (
                            <Text style={styles.warningTextSmall}>Please select Bereavement Type first</Text>
                        )}

                        <View style={styles.daysBlock}>
                            <Text style={[styles.infoText, styles.mt5]}>No.of days: <Text style={styles.infoTextBold}>{noOfDays}</Text></Text>
                        </View>

                        {/* Validation Loader */}
                        {isValidatingDates && (
                            <View style={styles.validationLoader}>
                                <ActivityIndicator size="small" color={COLORS.blue} />
                            </View>
                        )}

                        {/* Half Day Selectors — only show when validation passes */}
                        {fromDate && toDate && !validationError && !isValidatingDates && hasValidSessions && (
                            <View style={[styles.sessionRow, styles.zIndex10, styles.mt10]}>
                                {Object.keys(validDatesMap).sort().map(dateStr => (
                                    <HalfDaySelector
                                        key={dateStr}
                                        date={parseAPIDate(dateStr)}
                                        selectedSession={selectedSessions[dateStr]}
                                        sessionTypes={validDatesMap[dateStr]}
                                        onSelect={(newSession) => {
                                            setSelectedSessions(prev => ({
                                                ...prev,
                                                [dateStr]: newSession
                                            }));
                                        }}
                                        formatDate={formatDate}
                                    />
                                ))}
                            </View>
                        )}

                        {/* Warning Message */}
                        {(isBalanceLow || validationError) && (
                            <Text style={styles.warningText}>{validationError || 'Leave balance is low'}</Text>
                        )}

                        <View style={[styles.divider, styles.mt10]} />

                        {/* Reports To Section */}
                        <ReportsToSection managerInfo={managerInfo} />

                        {/* Reason & Attach Section */}
                        <View style={styles.reasonAttachRow}>
                            <View style={styles.reasonBlock}>
                                <Text style={styles.label}>Reason<Text style={styles.asterisk}>*</Text></Text>
                                <TextInput
                                    style={styles.reasonInput}
                                    multiline={true}
                                    numberOfLines={4}
                                    value={reason}
                                    onChangeText={setReason}
                                />
                            </View>

                            <View style={styles.attachBlock}>
                                <AttachFilePicker
                                    onFileSelected={(file) => {
                                        // Handle file selection
                                    }}
                                />
                            </View>
                        </View>

                        <View style={[styles.divider, styles.mt16]} />

                        {/* Buttons Row */}
                        <View style={styles.actionRow}>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.applyButton, (isBalanceLow || isSubmitting) && styles.disabledButton]}
                                disabled={isBalanceLow || isSubmitting}
                                onPress={handleApply}
                            >
                                {isSubmitting ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.applyButtonText}>Apply</Text>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={() => navigation.goBack()} disabled={isSubmitting}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>

                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    modalBackground: {
        flex: 1,
        backgroundColor: COLORS.pageBg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    keyboardView: {
        width: '100%',
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    modalCard: {
        backgroundColor: COLORS.white,
        borderRadius: 8,
        width: '100%',
        maxWidth: 600,
        maxHeight: '90%',
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    headerRow: {
        backgroundColor: COLORS.blue,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    scrollContent: {
        padding: 16,
    },
    infoBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    infoText: {
        fontSize: 14,
        color: COLORS.darkText,
        fontWeight: '500',
    },
    infoTextBold: {
        color: '#8a2be2',
        fontWeight: 'bold',
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.gray,
        marginVertical: 10,
        width: '100%',
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    sessionRow: {
        flexDirection: 'column',
        alignItems: 'flex-start',
    },
    daysBlock: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 2,
    },
    label: {
        fontSize: 14,
        color: COLORS.darkText,
        fontWeight: '600',
    },
    asterisk: {
        color: COLORS.red,
    },
    validationLoader: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    warningText: {
        color: COLORS.red,
        textAlign: 'center',
        marginTop: 10,
        fontWeight: '600',
        fontSize: 13,
    },
    warningTextSmall: {
        color: COLORS.red,
        fontSize: 12,
        marginTop: 4,
        marginLeft: 2,
    },
    reasonAttachRow: {
        flexDirection: 'row',
        marginTop: 16,
        justifyContent: 'space-between',
    },
    reasonBlock: {
        flex: 1,
        marginRight: 16,
    },
    reasonInput: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 6,
        padding: 8,
        minHeight: 70,
        textAlignVertical: 'top',
        color: COLORS.darkText,
        fontSize: 13,
    },
    attachBlock: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginTop: 10,
    },
    actionButton: {
        paddingHorizontal: 24,
        paddingVertical: 8,
        borderRadius: 4,
        marginLeft: 12,
    },
    applyButton: {
        backgroundColor: COLORS.blue,
    },
    applyButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 13,
    },
    disabledButton: {
        backgroundColor: '#9ca3af',
    },
    cancelButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: COLORS.red,
    },
    cancelButtonText: {
        color: COLORS.red,
        fontWeight: '600',
        fontSize: 13,
    },
    bereavementContainer: {
        marginTop: 8,
        width: '100%',
        zIndex: 20, // ensure dropdown sits over elements below
    },
    bereavementDropdownButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 38,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 6,
        paddingHorizontal: 10,
        backgroundColor: COLORS.white,
    },
    bereavementDropdownButtonText: {
        fontSize: 13,
        color: COLORS.darkText,
    },
    bereavementDropdownList: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 4,
        zIndex: 999, // pop over other elements
        elevation: 10, // force over android stacking
        marginTop: 2,
    },
    dropdownOption: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    dropdownOptionText: {
        fontSize: 13,
        color: COLORS.darkText,
    },
    mt10: { marginTop: 10 },
    mt5: { marginTop: 5 },
    mb6: { marginBottom: 6 },
    zIndex10: { zIndex: 10 },
    zIndex20: { zIndex: 20 },
    dropdownContainer: { flex: 1, position: 'relative' },
    mt16: { marginTop: 16 },
});

export default LeaveApplyScreen;
