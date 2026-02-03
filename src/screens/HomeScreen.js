import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Modal,
    Platform,
    ScrollView,
    Alert,
    PermissionsAndroid,
    RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/SimpleLineIcons';
import Icons from 'react-native-vector-icons/MaterialCommunityIcons';
import moment from 'moment';
import Geolocation from 'react-native-geolocation-service';
import AttendanceService from '../services/AttendanceService';
import AuthService from '../services/AuthService';
import { WORK_LOCATIONS, OFFICE_LOCATION } from '../constants/Config';
import { COLORS, SHADOW } from '../utils/theme';
import { calculateDistance } from '../utils/LocationHelper';
import LoadingOverlay from '../components/LoadingOverlay';

const HomeScreen = ({ route, navigation }) => {
    const userName = route.params?.userName || route.params?.displayName;
    const [currentTime, setCurrentTime] = useState(moment());
    const [remarks, setRemarks] = useState('');

    // UI State driven by Backend APIs
    const [showCheckInButton, setShowCheckInButton] = useState(true);
    const [locationStatusMessage, setLocationStatusMessage] = useState(null);
    const [todayActivity, setTodayActivity] = useState([]);

    const [activeWorkMode, setActiveWorkMode] = useState(null);
    const [selectedWorkMode, setSelectedWorkMode] = useState(null);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(moment());
        }, 1000);

        requestLocationPermission();
        fetchInitialData();

        return () => clearInterval(timer);
    }, []);

    const fetchInitialData = async (isRefreshing = false) => {
        if (!isRefreshing) setLoading(true);
        try {
            const userInfo = await AuthService.getUserInfo();
            if (!userInfo?.userId) {
                if (!isRefreshing) setLoading(false);
                return;
            }

            const today = moment().format('YYYY-MM-DD');

            // 1. Fetch Today's Activity (Independent Call)
            try {
                const activityRes = await AttendanceService.getUserLoginData(userInfo?.userId, today);
                const activities = activityRes.data || [];
                setTodayActivity(activities);

                if (activities.length > 0) {
                    const latest = activities[activities.length - 1];
                    if (latest.currStatus) {
                        setActiveWorkMode(latest.workMode);
                    } else {
                        setActiveWorkMode(null);
                    }
                } else {
                    setActiveWorkMode(null);
                }
            } catch (err) {
                if (err.response?.status !== 404) {
                    console.error('Fetch Activity Error:', err);
                }
            }

            // 2. Fetch Employee Last Status (Handles 404 gracefully)
            try {
                const statusRes = await AttendanceService.checkEmployeeLastStatusOfToday(userInfo?.userId);
                setShowCheckInButton(statusRes.data === false);
                setLocationStatusMessage(null);
            } catch (error) {
                if (error.response?.status === 404) {
                    const msg = error.response.data?.message || "Work location not assigned for today. Please contact your resource manager.";
                    setShowCheckInButton(false);
                    setLocationStatusMessage(msg);

                    // Brief delay to allow user to see the message in the LoadingOverlay
                    if (!isRefreshing) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                } else {
                    console.error('Status API Error:', error);
                    Alert.alert('Error', 'Failed to fetch latest attendance status.');
                }
            }

        } catch (error) {
            console.error('Fetch Initial Data General Error:', error);
        } finally {
            if (isRefreshing) setRefreshing(false);
            else setLoading(false);
        }
    };

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchInitialData(true);
    }, []);

    const handleLogout = () => {
        Alert.alert('Logout', 'Do you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Logout',
                style: 'destructive',
                onPress: async () => {
                    await AuthService.signOut();
                    navigation.replace('Login');
                }
            },
        ]);
    };

    const requestLocationPermission = async () => {
        if (Platform.OS === 'android') {
            try {
                await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
            } catch (err) {
                console.warn(err);
            }
        }
    };

    const handleAttendanceClick = () => {
        const isCurrentlyCheckedIn = !showCheckInButton;
        setSelectedWorkMode(isCurrentlyCheckedIn ? activeWorkMode : null);
        setShowLocationModal(true);
    };

    const handleConfirmSelection = async () => {
        if (!selectedWorkMode) return;

        const isCurrentlyCheckedIn = !showCheckInButton;

        if (isCurrentlyCheckedIn && selectedWorkMode !== activeWorkMode) {
            Alert.alert(
                'Location Mismatch',
                'Location mismatch. Please check out using the same work mode.'
            );
            return;
        }

        setShowLocationModal(false);
        setLoading(true);

        try {
            const userInfo = await AuthService.getUserInfo();
            const token = await AuthService.getBackendToken();

            if (!token) {
                navigation.replace('Login');
                return;
            }

            Geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;

                    // --- Geofencing Logic for Office Mode ---
                    if (selectedWorkMode === 'Office') {
                        const distance = calculateDistance(
                            latitude,
                            longitude,
                            OFFICE_LOCATION.LATITUDE,
                            OFFICE_LOCATION.LONGITUDE
                        );

                        const isInsideGeofence = distance <= OFFICE_LOCATION.RADIUS;

                        if (!isInsideGeofence) {
                            setLoading(false);
                            if (showCheckInButton) {
                                // Rule 1: Office Check-In Rule
                                Alert.alert('Geofence Error', 'You must be at the office location to check in as Office.');
                            } else {
                                // Rule 2: Office Check-Out Rule
                                Alert.alert('Geofence Error', 'Office check-out is not allowed outside the office location.');
                            }
                            // Rule 3 is also covered here as both in/out are blocked if outside
                            return;
                        }
                    }

                    const payload = {
                        userId: userInfo?.userId,
                        location: 'Chennai',
                        workMode: selectedWorkMode,
                        currStatus: showCheckInButton, // true if checking in, false if checking out
                        remarks: remarks || '',
                    };

                    console.log('payload', payload);

                    try {
                        await AttendanceService.checkInOut(payload);

                        setRemarks('');
                        Alert.alert('Success', `Successfully ${showCheckInButton ? 'Checked In' : 'Checked Out'}!`);

                        await fetchInitialData();
                    } catch (error) {
                        console.error('CheckInOut API Error:', error);
                        Alert.alert('Error', 'Action failed. Please try again.');
                        setLoading(false);
                    }
                },
                (error) => {
                    setLoading(false);
                    Alert.alert('Location Error', 'Unable to fetch GPS location.');
                },
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
            );

        } catch (error) {
            setLoading(false);
            Alert.alert('Error', 'An unexpected error occurred.');
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                <View style={styles.header}>
                    <View>
                        <Text style={styles.welcomeText}>Welcome back,</Text>
                        <Text style={styles.userNameText}>{userName || 'User'}</Text>
                    </View>
                    <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                        <Icon name="logout" size={20} color={COLORS.secondary} />
                    </TouchableOpacity>
                </View>

                {/* Attendance Card */}
                <View style={styles.card}>
                    <View style={styles.cardTop}>
                        <View>
                            <Text style={styles.timeText}>{currentTime.format('hh : mm : ss A')}</Text>
                            <Text style={styles.dateText}>{currentTime.format('ddd, MMM DD, YYYY')}</Text>
                            <Text style={styles.shiftText}>Shift: General (10:00 AM - 7:00 PM)</Text>
                        </View>
                        <Icons name="calendar-clock" size={35} color={COLORS.primary} />
                    </View>

                    {locationStatusMessage ? (
                        <View style={styles.infoBox}>
                            <Icon name="information-outline" size={22} color={COLORS.primary} />
                            <Text style={styles.infoText}>{locationStatusMessage}</Text>
                        </View>
                    ) : (
                        <View style={styles.cardBottom}>
                            <TextInput
                                style={styles.input}
                                placeholder="Remarks"
                                placeholderTextColor="#999"
                                value={remarks}
                                onChangeText={setRemarks}
                            />
                            <TouchableOpacity
                                style={[styles.button, showCheckInButton ? styles.checkInBtn : styles.checkOutBtn]}
                                onPress={handleAttendanceClick}
                                disabled={loading}
                            >
                                <Text style={styles.buttonText}>
                                    {showCheckInButton ? 'Check In' : 'Check Out'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
                {/* Today's Activity Card */}
                <View style={[styles.card, styles.activityCard]}>
                    <Text style={styles.activityTitle}>Today's Activity</Text>

                    {todayActivity.length === 0 ? (
                        <Text style={styles.emptyText}>No activity recorded yet today.</Text>
                    ) : (
                        [...todayActivity]?.map((item, index) => (
                            <View key={item.id || index} style={styles.activityItem}>
                                <View style={styles.activityIconWrapper}>
                                    <View style={[styles.statusDot, item.currStatus ? styles.dotIn : styles.dotOut]} />
                                    {index !== todayActivity.length - 1 && <View style={styles.timelineConnector} />}
                                </View>
                                <View style={styles.activityDetails}>
                                    <View style={styles.activityRow}>
                                        <Text style={[styles.activityStatus, item.currStatus ? styles.textIn : styles.textOut]}>
                                            {item.currStatus ? 'Check In' : 'Check Out'}
                                        </Text>
                                        <Text style={styles.activityTime}>
                                            {item.time ? moment(item.time, 'HH:mm:ss').format('hh:mm A') : ''}
                                        </Text>
                                    </View>
                                    <View style={styles.activityLocationRow}>
                                        <Icons
                                            name={item.workMode === 'Office' ? 'office-building' : item.workMode === 'Work from home' ? 'home' : 'account-group'}
                                            size={14}
                                            color="#666"
                                        />
                                        <Text style={styles.activityLocationText}>
                                            {item.workMode} • {item.location}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>

            <Modal visible={showLocationModal} transparent animationType="slide">
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowLocationModal(false)}
                >
                    <View style={styles.bottomSheet}>
                        <View style={styles.sheetHeader}>
                            <View style={styles.sheetHandle} />
                            <Text style={styles.sheetTitle}>Select Work Mode</Text>
                        </View>

                        <View style={styles.optionsContainer}>
                            {WORK_LOCATIONS.map((loc) => (
                                <TouchableOpacity
                                    key={loc.id}
                                    style={[
                                        styles.option,
                                        selectedWorkMode === loc.label && styles.selectedOption
                                    ]}
                                    onPress={() => setSelectedWorkMode(loc.label)}
                                >
                                    <Icons
                                        name={loc.icon}
                                        size={24}
                                        color={selectedWorkMode === loc.label ? COLORS.primary : "#333"}
                                        style={styles.optionIcon}
                                    />
                                    <Text style={[
                                        styles.optionText,
                                        selectedWorkMode === loc.label && styles.selectedOptionText
                                    ]}>
                                        {loc.label}
                                    </Text>
                                    {selectedWorkMode === loc.label && (
                                        <Icons name="check-circle" size={20} color={COLORS.primary} style={styles.checkIcon} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.sheetFooter}>
                            <TouchableOpacity
                                style={[styles.confirmButton, !selectedWorkMode && styles.disabledButton]}
                                onPress={handleConfirmSelection}
                                disabled={!selectedWorkMode}
                            >
                                <Text style={styles.confirmButtonText}>Confirm</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>

            <LoadingOverlay
                visible={loading}
                message={locationStatusMessage}
                showCheckInButton={showCheckInButton}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    scrollContent: { padding: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    welcomeText: { fontSize: 14, color: '#666' },
    userNameText: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    logoutBtn: { padding: 8 },
    card: { backgroundColor: '#fff', borderRadius: 15, padding: 20, marginBottom: 20, ...SHADOW },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    timeText: { fontSize: 28, fontWeight: 'bold', color: COLORS.primary, fontVariant: ['tabular-nums'] },
    dateText: { fontSize: 16, color: '#666', marginTop: 4 },
    shiftText: { fontSize: 14, color: '#888', marginTop: 4 },
    cardBottom: { flexDirection: 'row', gap: 12 },
    input: { flex: 1, borderWidth: 1, borderColor: '#eee', borderRadius: 10, paddingHorizontal: 15, height: 50, color: '#333' },
    button: { paddingHorizontal: 20, height: 50, borderRadius: 10, justifyContent: 'center', alignItems: 'center', minWidth: 120 },
    checkInBtn: { backgroundColor: COLORS.primary },
    checkOutBtn: { backgroundColor: COLORS.error },
    buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    activityCard: { paddingTop: 15 },
    activityTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 20 },
    activityItem: { flexDirection: 'row', marginBottom: 12 },
    activityIconWrapper: { width: 30, alignItems: 'center' },
    statusDot: { width: 12, height: 12, borderRadius: 6, marginTop: 6, zIndex: 1 },
    dotIn: { backgroundColor: COLORS.primary, elevation: 5 },
    dotOut: { backgroundColor: COLORS.error, elevation: 5 },
    timelineConnector: { width: 2, flex: 1, backgroundColor: '#eee', position: 'absolute', top: 18, bottom: -15 },
    activityDetails: { flex: 1, backgroundColor: '#f9f9f9', padding: 12, borderRadius: 12, marginLeft: 10 },
    activityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    activityStatus: { fontWeight: 'bold', fontSize: 15 },
    textIn: { color: COLORS.primary },
    textOut: { color: COLORS.error },
    activityTime: { fontSize: 13, color: '#888' },
    activityLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    activityLocationText: { fontSize: 13, color: '#666' },
    emptyText: { textAlign: 'center', color: '#999', marginVertical: 20 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    bottomSheet: { backgroundColor: '#fff', borderTopLeftRadius: 25, borderTopRightRadius: 25, paddingBottom: 25, maxHeight: '80%' },
    sheetHeader: { alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    sheetHandle: { width: 40, height: 5, backgroundColor: '#ddd', borderRadius: 3, marginBottom: 10 },
    sheetTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    optionsContainer: { padding: 20 },
    option: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 15, marginBottom: 12, backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#f0f0f0' },
    selectedOption: { backgroundColor: '#f0f4ff', borderColor: COLORS.primary },
    optionIcon: { marginRight: 15 },
    optionText: { flex: 1, fontSize: 16, color: '#333', fontWeight: '500' },
    selectedOptionText: { color: COLORS.primary, fontWeight: 'bold' },
    sheetFooter: { paddingHorizontal: 20, paddingTop: 10 },
    confirmButton: { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 15, alignItems: 'center', ...SHADOW },
    disabledButton: { backgroundColor: '#ccc' },
    confirmButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e3f2fd',
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#bbdefb',
    },
    infoText: {
        flex: 1,
        color: '#1976d2',
        fontSize: 14,
        marginLeft: 10,
        fontWeight: '500',
        lineHeight: 20,
    },
});

export default HomeScreen;
