import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LeaveService from '../../services/LeaveService';
import AuthService from '../../services/AuthService';
import AttachFilePicker from '../../components/AttachFilePicker';
import DatePickerField from '../../components/leave/DatePickerField';
import HalfDaySelector from '../../components/leave/HalfDaySelector';
import ReportsToSection from '../../components/leave/ReportsToSection';
import useLeaveRequestStore from '../../store/useLeaveRequestStore';
import useLeaveStore from '../../store/useLeaveStore';
import { COLORS } from '../../utils/theme';
import LoadingOverlay from '../../components/LoadingOverlay';

import { formatToAPI, parseAPIDate, formatDate, formatPermissionTime, convertTimeToMinutes, formatMinutesToTime } from '../../utils/dateUtils';

const LeaveApplyScreen = ({ navigation, route }) => {
    const { leaveType, balance, isWFHCheckInFlow = false, onWFHApplySuccess = null } = route.params;

    // Date state
    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);

    // Session state
    const [selectedSessions, setSelectedSessions] = useState({});

    // Form state
    const [reason, setReason] = useState('');
    const [managerInfo, setManagerInfo] = useState({ name: 'Loading...', profile: null });
    const [noOfDays, setNoOfDays] = useState(0);
    const [selectedFile, setSelectedFile] = useState(null);

    // Permission Leave state
    const [permissionDate, setPermissionDate] = useState(null);
    const [rawDigits, setRawDigits] = useState('');
    const [displayTime, setDisplayTime] = useState('');
    const [isSubmittingPermission, setIsSubmittingPermission] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // Bereavement state
    const [bereavementTypes, setBereavementTypes] = useState([]);
    const [selectedBereavementType, setSelectedBereavementType] = useState(null);
    const [showBereavementDropdown, setShowBereavementDropdown] = useState(false);

    // Paternity state
    const [parentalCategories, setParentalCategories] = useState([]);
    const [selectedParentalCategory, setSelectedParentalCategory] = useState(null);
    const [showParentalDropdown, setShowParentalDropdown] = useState(false);
    const [hrList, setHrList] = useState([]);
    const [selectedHR, setSelectedHR] = useState(null);
    const [showHRDropdown, setShowHRDropdown] = useState(false);

    // Validation API state
    const [validDatesMap, setValidDatesMap] = useState({});
    const [validationError, setValidationError] = useState(null);
    const [isValidatingDates, setIsValidatingDates] = useState(false);
    const validationTimer = useRef(null);

    // CC List state
    const [ccList, setCCList] = useState([]);
    const [nameList, setNameList] = useState([]);
    const [selectedCC, setSelectedCC] = useState([]);

    // POST API state from Zustand
    const { isSubmitting, submitLeaveRequest } = useLeaveRequestStore();

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

    useEffect(() => {
        const loadCCList = async () => {
            try {
                const userInfo = await AuthService.getUserInfo();
                const userId = userInfo?.userId;
                const cc = await LeaveService.getCCList(userId);
                setCCList(cc);
            } catch (error) {
                console.warn('Failed to load CC list', error);
            }
        };

        const loadNameList = async () => {
            try {
                const userInfo = await AuthService.getUserInfo();
                const userId = userInfo?.userId;
                const name = await LeaveService.getNameList(userId);
                setNameList(name);
            } catch (error) {
                console.warn('Failed to load name list', error);
            }
        };


        const loadManagerInfo = async () => {
            try {
                const userInfo = await AuthService.getUserInfo();
                const userId = userInfo?.userId;
                const manager = await LeaveService.getManagerInfo(userId);
                setManagerInfo(manager);
            } catch (error) {
                console.warn('Failed to load manager info', error);
            }
        };
        loadCCList();
        loadNameList();
        loadManagerInfo();
    }, []);

    // ─── Auto-set dates for WFH Check-In Flow ───
    useEffect(() => {
        if (isWFHCheckInFlow) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            setFromDate(today);
            setToDate(today);
        }
    }, [isWFHCheckInFlow]);

    // ─── Fetch Bereavement Types ───
    useEffect(() => {
        if (leaveType !== 'Bereavement Leave') return;
        const fetchBereavementTypes = async () => {
            try {
                const types = await LeaveService.getBereavementLeaveTypes();
                setBereavementTypes(types || []);
            } catch (error) {
            }
        };
        fetchBereavementTypes();
    }, [leaveType]);

    // ─── Fetch Paternity Leave Data ───
    useEffect(() => {
        if (leaveType !== 'Paternity Leave') return;

        const fetchPaternityData = async () => {
            try {
                // Fetch Categories
                const categoriesData = await LeaveService.getParentalLeaveCategories('Paternity Leave');
                if (categoriesData) {
                    const mappedCategories = Object.keys(categoriesData).map(key => ({
                        label: key,
                        value: key,
                        days: categoriesData[key]
                    }));
                    setParentalCategories(mappedCategories);
                }

                // Fetch HR List
                const hrData = await LeaveService.getHRList();
                setHrList(hrData || []);
            } catch (error) {
                // console.error('fetchPaternityData Error:', error);
            }
        };
        fetchPaternityData();
    }, [leaveType]);

    // ─── Reset fields on Parental Category Change ───
    useEffect(() => {
        if (leaveType === 'Paternity Leave') {
            setToDate(null);
            setValidDatesMap({});
            setValidationError(null);
            setSelectedSessions({});
            setIsValidatingDates(false);
            if (validationTimer.current) {
                clearTimeout(validationTimer.current);
                validationTimer.current = null;
            }
        }
    }, [selectedParentalCategory, leaveType]);

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

        if (leaveType === 'Permission' || leaveType === 'Work From Home') {
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

                if (leaveType === 'Paternity Leave' && selectedParentalCategory) {
                    apiParams.maternityLeaveCategory = selectedParentalCategory.value;
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
    }, [fromDate, toDate, leaveType, selectedBereavementType, selectedParentalCategory]);

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
    const hasValidSessions = leaveType === 'Work From Home' ? true : Object.keys(validDatesMap).length > 0;
    const isBalanceLow = validationError ? true : (leaveType !== 'Bereavement Leave' && leaveType !== 'Work From Home' && fromDate && toDate && noOfDays > balance);

    // ─── Build leaveDates payload from validDatesMap + user selections ───
    const buildLeaveDatesPayload = () => {
        if (leaveType === 'Work From Home') {
            const dates = [];
            let current = new Date(fromDate);
            const end = new Date(toDate);
            current.setHours(0, 0, 0, 0);
            end.setHours(0, 0, 0, 0);
            while (current <= end) {
                dates.push({ date: formatToAPI(current), session: 'Full Day' });
                current.setDate(current.getDate() + 1);
            }
            return dates;
        }

        const dateKeys = Object.keys(validDatesMap).sort();
        return dateKeys.map((dateKey) => {
            const session = selectedSessions[dateKey] || 'Full Day';
            return { date: dateKey, session };
        });
    };

    // ─── Handle Apply ───
    const handleApply = async () => {
        setErrorMessage('');
        if (isBalanceLow || (isSubmitting || isSubmittingPermission)) return;

        if (leaveType === 'Permission') {
            if (!permissionDate) {
                showError('Please select a date');
                return;
            }
            const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
            if (!rawDigits || !timeRegex.test(displayTime)) {
                showError('Please enter a valid time in HH:MM format');
                return;
            }
            if (!reason.trim()) {
                showError('Please enter a reason');
                return;
            }
        } else {
            if (!fromDate || !toDate) {
                showError('Please select From and To dates');
                return;
            }
            if (leaveType === 'Bereavement Leave' && !selectedBereavementType) {
                showError('Please select a bereavement type');
                return;
            }
            if (leaveType === 'Paternity Leave' && !selectedParentalCategory) {
                showError('Please select a category');
                return;
            }
            if (leaveType === 'Paternity Leave' && !selectedHR) {
                showError('Please select an HR');
                return;
            }
            if (leaveType === 'Paternity Leave' && !selectedFile) {
                showError('Birth Certificate or Discharge Summary is required');
                return;
            }
            if (!reason.trim()) {
                showError('Please enter a reason');
                return;
            }
            if (!hasValidSessions) {
                showError('Please wait for date validation to complete');
                return;
            }
        }

        try {
            const userInfo = await AuthService.getUserInfo();
            const userId = userInfo?.userId;

            let successMsg = '';
            if (leaveType === 'Permission') {
                setIsSubmittingPermission(true);
                const minutes = convertTimeToMinutes(displayTime);

                const payload = {
                    permissionTime: minutes,
                    date: formatToAPI(permissionDate),
                    userId,
                    reason: reason.trim(),
                };

                if (selectedCC.length > 0) {
                    payload.cc = selectedCC.map(item => item.email);
                }

                const response = await LeaveService.submitPermissionRequest(payload);
                if (!response.success) {
                    throw new Error(response.message);
                }
                successMsg = response.message;
            } else {
                const leaveDatesPayload = buildLeaveDatesPayload();

                const payload = {
                    reason: reason.trim(),
                    type: leaveType,
                    userId,
                    leaveDates: leaveDatesPayload,
                };

                if (leaveType === 'Bereavement Leave' && selectedBereavementType) {
                    payload.bereavementLeaveType = selectedBereavementType.id;
                }

                if (leaveType === 'Paternity Leave' && selectedParentalCategory) {
                    payload.maternityLeaveCategory = selectedParentalCategory.value;
                }

                if (leaveType === 'Paternity Leave' && selectedHR) {
                    payload.hrCc = [selectedHR.mail];
                }

                if (selectedFile) {
                    payload.fileName = selectedFile.fileName;
                    payload.fileType = selectedFile.fileType;
                    payload.fileData = selectedFile.fileData;
                }

                // if (leaveType === 'Paternity Leave' && selectedFile2) {
                //     payload.fileName2 = selectedFile2.fileName;
                //     payload.fileType2 = selectedFile2.fileType;
                //     payload.fileData2 = selectedFile2.fileData;
                // }

                if (selectedCC.length > 0) {
                    payload.cc = selectedCC.map(item => item.email).join(',');
                }

                const response = await submitLeaveRequest(payload);
                successMsg = response?.message || response?.data
            }

            // Refresh leave balances so LeaveRequest screen updates immediately
            const { fetchLeaveBalances } = useLeaveStore.getState();
            fetchLeaveBalances(userId, new Date().getFullYear());

            showSuccess(successMsg, () => {
                navigation.goBack();
                // If coming from WFH check-in flow, trigger auto check-in on HomeScreen
                if (isWFHCheckInFlow && onWFHApplySuccess) {
                    // Small delay to let navigation settle before triggering check-in
                    setTimeout(() => {
                        onWFHApplySuccess();
                    }, 500);
                }
            });
        } catch (error) {
            if (leaveType === 'Permission') {
                const message = error?.response?.data?.message || error?.response?.data || error?.message || "Something went wrong. Please try again.";
                setErrorMessage(typeof message === 'string' ? message : JSON.stringify(message));
            } else {
                const message = error?.response?.data?.message || error?.response?.data || error?.message || 'Unable to submit leave request';
                showError(typeof message === 'string' ? message : JSON.stringify(message));
            }
        } finally {
            if (leaveType === 'Permission') setIsSubmittingPermission(false);
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

    const isDateDisabled = (leaveType === 'Bereavement Leave' && !selectedBereavementType) || (leaveType === 'Paternity Leave' && !selectedParentalCategory);

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
                            {leaveType !== 'Bereavement Leave' && leaveType !== 'Loss Of Pay' && leaveType !== 'Work From Home' && (
                                <Text style={styles.infoText}> Balance: <Text style={styles.infoTextBold}>
                                    {leaveType === 'Permission'
                                        ? (balance ? formatMinutesToTime(balance) : '0:00hrs')
                                        : (balance ?? 0)}
                                </Text></Text>
                            )}
                        </View>

                        {/* Paternity Category Dropdown */}
                        {leaveType === 'Paternity Leave' && (
                            <View style={styles.bereavementContainer}>
                                <Text style={[styles.label, styles.mb6]}>
                                    Category<Text style={styles.asterisk}>*</Text>
                                </Text>
                                <View style={[styles.dropdownContainer, styles.zIndex20]}>
                                    <TouchableOpacity
                                        style={styles.bereavementDropdownButton}
                                        onPress={() => setShowParentalDropdown(!showParentalDropdown)}
                                    >
                                        <Text style={styles.bereavementDropdownButtonText}>
                                            {selectedParentalCategory ? selectedParentalCategory.label : 'Select Category'}
                                        </Text>
                                        <Icon name="menu-down" size={20} color={COLORS.darkText} />
                                    </TouchableOpacity>
                                    {showParentalDropdown && (
                                        <View style={styles.bereavementDropdownList}>
                                            {parentalCategories.map((cat, idx) => (
                                                <TouchableOpacity
                                                    key={idx.toString()}
                                                    style={styles.dropdownOption}
                                                    onPress={() => {
                                                        setSelectedParentalCategory(cat);
                                                        setShowParentalDropdown(false);
                                                    }}
                                                >
                                                    <Text style={styles.dropdownOptionText}>{cat.label}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            </View>
                        )}

                        {/* Bereavement Type Dropdown */}
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
                                            {selectedBereavementType ? selectedBereavementType.bereavementLeaveType : 'Select Bereavement Type'}
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

                        {leaveType === 'Permission' ? (
                            <View style={styles.dateRow}>
                                <DatePickerField
                                    label="Date"
                                    date={permissionDate}
                                    onDateChange={setPermissionDate}
                                    minimumDate={new Date()}
                                    formatDate={formatDate}
                                    disabled={false}
                                />
                                <View style={styles.timeInputBlock}>
                                    <Text style={styles.label}>Time<Text style={styles.asterisk}>*</Text></Text>
                                    <TextInput
                                        style={styles.timeInput}
                                        placeholder="e.g. 02:30 hrs"
                                        placeholderTextColor="#9ca3af"
                                        value={displayTime}
                                        keyboardType="numeric"
                                        maxLength={5}
                                        onChangeText={(text) => {
                                            const digits = text.replace(/\D/g, "");

                                            // handle deletion
                                            if (digits.length < rawDigits.length) {
                                                setRawDigits("");
                                                setDisplayTime("");
                                                return;
                                            }

                                            if (digits.length <= 4) {
                                                setRawDigits(digits);

                                                const formatted = formatPermissionTime(digits);

                                                if (digits.length === 4 && formatted) {
                                                    setDisplayTime(formatted);
                                                } else {
                                                    setDisplayTime(digits);
                                                }
                                            }
                                        }}
                                    />
                                </View>
                            </View>
                        ) : (
                            <>
                                {/* Date Picker Row */}
                                <View style={styles.dateRow}>
                                    <DatePickerField
                                        label="From"
                                        date={fromDate}
                                        onDateChange={handleFromDateChange}
                                        minimumDate={new Date()}
                                        formatDate={formatDate}
                                        disabled={isDateDisabled || isWFHCheckInFlow}
                                    />
                                    <DatePickerField
                                        label="To"
                                        date={toDate}
                                        onDateChange={handleToDateChange}
                                        minimumDate={fromDate || new Date()}
                                        formatDate={formatDate}
                                        disabled={isDateDisabled || isWFHCheckInFlow}
                                    />
                                </View>

                                {isDateDisabled && (
                                    <Text style={styles.warningTextSmall}>
                                        {leaveType === 'Bereavement Leave' ? 'Please select Bereavement Type first' : 'Please select Category first'}
                                    </Text>
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
                                    <View style={[styles.sessionRow, styles.mt10]}>
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
                            </>
                        )}

                        {/* Warning Message */}
                        {(isBalanceLow || validationError) && (
                            <Text style={styles.warningText}>{validationError || 'Leave balance is low'}</Text>
                        )}

                        <View style={[styles.divider, styles.mt10]} />

                        {/* Reports To Section */}
                        <ReportsToSection
                            managerInfo={managerInfo}
                            ccList={[...ccList, ...nameList].filter((v, i, a) => a.findIndex(t => t.userId === v.userId) === i)}
                            selectedCC={selectedCC}
                            setSelectedCC={setSelectedCC}
                            hideCCField={isWFHCheckInFlow}
                        />

                        {/* Reason Section */}
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
                        </View>

                        {/* HR Dropdown for Paternity Leave */}
                        {leaveType === 'Paternity Leave' && (
                            <View style={[styles.bereavementContainer, styles.mt16]}>
                                <Text style={[styles.label, styles.mb6]}>
                                    Select HR<Text style={styles.asterisk}>*</Text>
                                </Text>
                                <View style={[styles.dropdownContainer, styles.zIndex10]}>
                                    <TouchableOpacity
                                        style={styles.bereavementDropdownButton}
                                        onPress={() => setShowHRDropdown(!showHRDropdown)}
                                    >
                                        <Text style={styles.bereavementDropdownButtonText}>
                                            {selectedHR ? selectedHR.displayName : 'Select HR'}
                                        </Text>
                                        <Icon name="menu-down" size={20} color={COLORS.darkText} />
                                    </TouchableOpacity>
                                    {showHRDropdown && (
                                        <ScrollView style={styles.hrDropdownList} nestedScrollEnabled={true}>
                                            {hrList.map((hr) => (
                                                <TouchableOpacity
                                                    key={hr.userId.toString()}
                                                    style={styles.dropdownOption}
                                                    onPress={() => {
                                                        setSelectedHR(hr);
                                                        setShowHRDropdown(false);
                                                    }}
                                                >
                                                    <Text style={styles.dropdownOptionText}>{hr.displayName}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    )}
                                </View>
                            </View>
                        )}

                        <View style={styles.reasonAttachRow}>
                            <View style={styles.attachBlock}>
                                <AttachFilePicker
                                    onFileSelected={setSelectedFile}
                                    onError={showError}
                                    label={leaveType === 'Paternity Leave' ? 'Birth Certificate or Discharge Summary' : 'Attach File (jpg, png, pdf, doc)'}
                                />
                            </View>
                        </View>

                        <View style={[styles.divider, styles.mt16]} />

                        {/* Error Message */}
                        {errorMessage ? (
                            <Text style={styles.errorText}>{errorMessage}</Text>
                        ) : null}

                        {/* Buttons Row */}
                        <View style={styles.actionRow}>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.applyButton, (isBalanceLow || isSubmitting || isSubmittingPermission) && styles.disabledButton]}
                                disabled={isBalanceLow || isSubmitting || isSubmittingPermission}
                                onPress={handleApply}
                            >
                                {isSubmitting || isSubmittingPermission ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.applyButtonText}>Apply</Text>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={() => navigation.goBack()} disabled={isSubmitting || isSubmittingPermission}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>

                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
            <LoadingOverlay {...overlay} />
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
        overflow: 'visible',
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
        zIndex: 2000,
        elevation: 10,
        overflow: 'visible',
    },
    daysBlock: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 2,
    },
    timeInputBlock: {
        flex: 1,
        marginLeft: 16,
    },
    timeInput: {
        height: 38,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 6,
        paddingHorizontal: 10,
        color: COLORS.darkText,
        fontSize: 13,
        marginLeft: 2,
        backgroundColor: COLORS.white,
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
    errorText: {
        color: COLORS.red || 'red',
        fontSize: 13,
        marginBottom: 10,
        textAlign: 'center',
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
    hrDropdownList: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 4,
        zIndex: 999,
        elevation: 10,
        marginTop: 2,
        maxHeight: 200,
    },
});

export default LeaveApplyScreen;
