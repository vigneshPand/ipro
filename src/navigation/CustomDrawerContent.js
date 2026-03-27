import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Icons from 'react-native-vector-icons/Octicons';
import { COLORS } from '../utils/theme';
import AuthService from '../services/AuthService';
import LoadingOverlay from '../components/LoadingOverlay';
import useRoleStore from '../store/useRoleStore';

const CustomDrawerContent = (props) => {

    const [isAttendanceExpanded, setIsAttendanceExpanded] = useState(false);
    const [isLeaveExpanded, setIsLeaveExpanded] = useState(false);
    const [userProfile, setUserProfile] = useState(null);
    const { activeTab } = useRoleStore();

    const [overlay, setOverlay] = useState({
        visible: false,
        message: '',
        type: 'loading',
        onConfirm: null,
        onCancel: null
    });

    const insets = useSafeAreaInsets();
    const { state, navigation } = props;
    const activeRoute = state.routeNames[state.index];

    const isLeaveSubMenu = [
        'Holidays',
        'LeaveRequest',
        'LeaveHistory',
        'CompOffGrantRequest',
        'CompOffHistory',
        'TeamLeaveRequests'
    ].includes(activeRoute);

    const isAttendanceSubMenu = [
        'Attendance Grid',
        // 'Regularization',
        'WFHRequest',
        'WFHHistory',
        'RegularizationHistory',
    ].includes(activeRoute);

    const isParentActive = (submenu, expanded) => submenu && !expanded;

    useEffect(() => {
        if (isAttendanceSubMenu) setIsAttendanceExpanded(true);
        if (isLeaveSubMenu) setIsLeaveExpanded(true);
    }, [activeRoute, isAttendanceSubMenu, isLeaveSubMenu]);

    useEffect(() => {
        loadUserProfile();
    }, []);

    const loadUserProfile = async () => {
        const profile = await AuthService.getUserInfo();
        setUserProfile(profile);
    };

    const toggleLeaveMenu = () => setIsLeaveExpanded(!isLeaveExpanded);
    const toggleAttendanceMenu = () => setIsAttendanceExpanded(!isAttendanceExpanded);

    const hideOverlay = useCallback(() =>
        setOverlay(prev => ({ ...prev, visible: false })), []);

    const showConfirm = useCallback((message, onConfirm, onCancel = hideOverlay) =>
        setOverlay({
            visible: true,
            message,
            type: 'confirm',
            onConfirm: () => { hideOverlay(); onConfirm(); },
            onCancel
        }), [hideOverlay]);

    const handleLogout = () => {
        showConfirm(
            'Do you want to logout?',
            async () => {
                try {
                    await AuthService.signOut();
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'Login' }],
                    });
                } catch (error) {
                    console.error('Logout error:', error);
                }
            }
        );
    };

    const navigateTo = (screen) => navigation.navigate(screen);

    return (
        <View style={styles.container}>

            {/* HEADER */}
            <View style={[styles.header, { paddingTop: insets.top || 20 }]}>
                <Image
                    source={require('../assets/iPro_white.png')}
                    resizeMode="contain"
                    style={styles.logo}
                />
            </View>

            <DrawerContentScrollView
                {...props}
                contentContainerStyle={styles.scrollContent}
                style={styles.drawerScrollView}
            >

                {activeTab === 'Team' && (
                    <>
                        <TouchableOpacity
                            style={[
                                styles.menuItem,
                                activeRoute === 'Home' && styles.activeMenuItem
                            ]}
                            onPress={() => navigateTo('Home')}
                        >
                            <Icon
                                name="view-dashboard-outline"
                                size={24}
                                color={activeRoute === 'Home' ? COLORS.primary : '#fff'}
                            />
                            <Text
                                style={[
                                    styles.menuText,
                                    activeRoute === 'Home' && styles.activeMenuText
                                ]}
                            >
                                Team Dashboard
                            </Text>
                        </TouchableOpacity>
                        
                        {/* LEAVE (Manager Mode) */}
                        <TouchableOpacity
                            style={[
                                styles.menuItem,
                                isParentActive(isLeaveSubMenu, isLeaveExpanded) &&
                                styles.activeMenuItem
                            ]}
                            onPress={toggleLeaveMenu}
                        >
                            <Icon
                                name="umbrella-beach-outline"
                                size={24}
                                color={isParentActive(isLeaveSubMenu, isLeaveExpanded) ? COLORS.primary : '#fff'}
                            />

                            <Text
                                style={[
                                    styles.menuText,
                                    isParentActive(isLeaveSubMenu, isLeaveExpanded) &&
                                    styles.activeMenuText
                                ]}
                            >
                                Leave
                            </Text>

                            <Icon
                                name={isLeaveExpanded ? 'chevron-up' : 'chevron-down'}
                                size={24}
                                color={isParentActive(isLeaveSubMenu, isLeaveExpanded) ? COLORS.primary : '#fff'}
                                style={styles.chevronIcon}
                            />
                        </TouchableOpacity>

                        {isLeaveExpanded && (
                            <View style={styles.subMenuContainer}>
                                <TouchableOpacity
                                    style={[
                                        styles.subMenuItem,
                                        activeRoute === 'TeamLeaveRequests' && styles.activeSubMenuItem
                                    ]}
                                    onPress={() => navigateTo('TeamLeaveRequests')}
                                >
                                    <Text
                                        style={[
                                            styles.subMenuText,
                                            activeRoute === 'TeamLeaveRequests' && styles.activeMenuText
                                        ]}
                                    >
                                        Leave Request
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                        
                        {/* Manager-specific actions can be added here later */}
                    </>
                )}

                {activeTab === 'Self' && (
                    <>
                        {/* DASHBOARD */}
                        <TouchableOpacity
                            style={[
                                styles.menuItem,
                                activeRoute === 'Home' && styles.activeMenuItem
                            ]}
                            onPress={() => navigateTo('Home')}
                        >
                            <Icon
                                name="view-dashboard-outline"
                                size={24}
                                color={activeRoute === 'Home' ? COLORS.primary : '#fff'}
                            />
                            <Text
                                style={[
                                    styles.menuText,
                                    activeRoute === 'Home' && styles.activeMenuText
                                ]}
                            >
                                Dashboard
                            </Text>
                        </TouchableOpacity>

                        {/* ATTENDANCE */}
                        <TouchableOpacity
                            style={[
                                styles.menuItem,
                                isParentActive(isAttendanceSubMenu, isAttendanceExpanded) &&
                                styles.activeMenuItem
                            ]}
                            onPress={toggleAttendanceMenu}
                        >
                            <Icon
                                name="calendar-month-outline"
                                size={24}
                                color={
                                    isParentActive(isAttendanceSubMenu, isAttendanceExpanded)
                                        ? COLORS.primary
                                        : '#fff'
                                }
                            />

                            <Text
                                style={[
                                    styles.menuText,
                                    isParentActive(isAttendanceSubMenu, isAttendanceExpanded) &&
                                    styles.activeMenuText
                                ]}
                            >
                                Attendance
                            </Text>

                            <Icon
                                name={isAttendanceExpanded ? 'chevron-up' : 'chevron-down'}
                                size={24}
                                color={
                                    isParentActive(isAttendanceSubMenu, isAttendanceExpanded)
                                        ? COLORS.primary
                                        : '#fff'
                                }
                                style={styles.chevronIcon}
                            />
                        </TouchableOpacity>

                        {isAttendanceExpanded && (
                            <View style={styles.subMenuContainer}>
                                <TouchableOpacity
                                    style={[
                                        styles.subMenuItem,
                                        activeRoute === 'Attendance Grid' && styles.activeSubMenuItem
                                    ]}
                                    onPress={() => navigateTo('Attendance Grid')}
                                >
                                    <Text
                                        style={[
                                            styles.subMenuText,
                                            activeRoute === 'Attendance Grid' && styles.activeMenuText
                                        ]}
                                    >
                                        Attendance Grid
                                    </Text>
                                </TouchableOpacity>

                                {/* <TouchableOpacity
                                    style={[
                                        styles.subMenuItem,
                                        activeRoute === 'Regularization' && styles.activeSubMenuItem
                                    ]}
                                    onPress={() => navigateTo('Regularization')}
                                >
                                    <Text
                                        style={[
                                            styles.subMenuText,
                                            activeRoute === 'Regularization' && styles.activeMenuText
                                        ]}
                                    >
                                        Regularization
                                    </Text>
                                </TouchableOpacity> */}
                                <TouchableOpacity
                                    style={[
                                        styles.subMenuItem,
                                        activeRoute === 'Regularization' && styles.activeSubMenuItem
                                    ]}
                                    onPress={() => navigateTo('Regularization')}
                                >
                                    <Text
                                        style={[
                                            styles.subMenuText,
                                            activeRoute === 'Regularization' && styles.activeMenuText
                                        ]}
                                    >
                                        Regularization
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.subMenuItem,
                                        activeRoute === 'WFHRequest' && styles.activeSubMenuItem
                                    ]}
                                    onPress={() => navigateTo('WFHRequest')}
                                >
                                    <Text
                                        style={[
                                            styles.subMenuText,
                                            activeRoute === 'WFHRequest' && styles.activeMenuText
                                        ]}
                                    >
                                        WFH Request
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.subMenuItem,
                                        activeRoute === 'WFHHistory' && styles.activeSubMenuItem
                                    ]}
                                    onPress={() => navigateTo('WFHHistory')}
                                >
                                    <Text
                                        style={[
                                            styles.subMenuText,
                                            activeRoute === 'WFHHistory' && styles.activeMenuText
                                        ]}
                                    >
                                        WFH History
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* LEAVE */}
                        <TouchableOpacity
                            style={[
                                styles.menuItem,
                                isParentActive(isLeaveSubMenu, isLeaveExpanded) &&
                                styles.activeMenuItem
                            ]}
                            onPress={toggleLeaveMenu}
                        >
                            <Icon
                                name="umbrella-beach-outline"
                                size={24}
                                color={
                                    isParentActive(isLeaveSubMenu, isLeaveExpanded)
                                        ? COLORS.primary
                                        : '#fff'
                                }
                            />

                            <Text
                                style={[
                                    styles.menuText,
                                    isParentActive(isLeaveSubMenu, isLeaveExpanded) &&
                                    styles.activeMenuText
                                ]}
                            >
                                Leave
                            </Text>

                            <Icon
                                name={isLeaveExpanded ? 'chevron-up' : 'chevron-down'}
                                size={24}
                                color={
                                    isParentActive(isLeaveSubMenu, isLeaveExpanded)
                                        ? COLORS.primary
                                        : '#fff'
                                }
                                style={styles.chevronIcon}
                            />
                        </TouchableOpacity>

                        {
                            isLeaveExpanded && (
                                <View style={styles.subMenuContainer}>

                                    {[
                                        { name: 'Holidays', route: 'Holidays' },
                                        { name: 'Leave Request', route: 'LeaveRequest' },
                                        { name: 'Leave History', route: 'LeaveHistory' },
                                        { name: 'Comp-Off Grant Request', route: 'CompOffGrantRequest' },
                                        { name: 'Comp-Off History', route: 'CompOffHistory' },
                                    ].map(item => (
                                        <TouchableOpacity
                                            key={item.route}
                                            style={[
                                                styles.subMenuItem,
                                                activeRoute === item.route && styles.activeSubMenuItem
                                            ]}
                                            onPress={() => navigateTo(item.route)}
                                        >
                                            <Text
                                                style={[
                                                    styles.subMenuText,
                                                    activeRoute === item.route && styles.activeMenuText
                                                ]}
                                            >
                                                {item.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}

                                </View>
                            )
                        }
                    </>
                )}

            </DrawerContentScrollView >

            {/* FOOTER */}
            < View style={{ paddingBottom: insets.bottom || 15 }}>

                <View style={styles.logoutContainer}>
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <Icons name="sign-out" size={25} color={COLORS.error} />
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                </View>

                {
                    (userProfile?.displayName || userProfile?.empId) && (
                        <View style={styles.footer}>
                            <View style={styles.avatarContainer}>
                                {userProfile?.profile ? (
                                    <Image
                                        source={{ uri: `data:image/jpeg;base64,${userProfile.profile}` }}
                                        style={styles.managerImage}
                                    />
                                ) : (
                                    <View style={styles.placeholderAvatar}>
                                        <Icon name="account" size={30} color="#fff" />
                                    </View>
                                )}
                            </View>

                            <View style={styles.profileInfo}>
                                <Text style={styles.profileName}>{userProfile?.displayName}</Text>
                                <Text style={styles.profileId}>{userProfile?.empId}</Text>
                            </View>
                        </View>
                    )
                }

            </View >

            <LoadingOverlay {...overlay} />

        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#3E699B',
    },
    header: {
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 100,
    },
    logoContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    drawerScrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: 10,
        flexGrow: 1,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        marginHorizontal: 10,
        borderRadius: 8,
        marginBottom: 4,
    },
    activeMenuItem: {
        backgroundColor: '#fff',
    },
    menuText: {
        flex: 1,
        fontSize: 16,
        color: '#fff',
        marginLeft: 15,
    },
    activeMenuText: {
        color: '#3E699B',
        fontWeight: 'bold',
    },
    chevronIcon: {
        marginLeft: 'auto',
    },
    subMenuContainer: {
        paddingLeft: 40,
        paddingRight: 15,
        paddingBottom: 10,
    },
    subMenuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderRadius: 8,
        marginBottom: 2,
    },
    activeSubMenuItem: {
        backgroundColor: '#f5f8fc',
    },
    subMenuText: {
        fontSize: 15,
        color: '#fff',
        marginLeft: 15,
        flex: 1,
    },
    logoutContainer: {
        paddingHorizontal: 30,
        paddingBottom: 15,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 15,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },
    logoutText: {
        fontSize: 16,
        color: '#fff', // match COLORS.error
        marginLeft: 20,
        fontWeight: '400',
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#3E699B',
    },
    avatarContainer: {
        width: 46,
        height: 46,
        borderRadius: 23,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderAvatar: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    // avatarContainer: {
    //     width: 46,
    //     height: 46,
    //     borderRadius: 23,
    //     backgroundColor: '#e6ecf2ff', // Blue avatar background
    //     justifyContent: 'center',
    //     alignItems: 'center',
    // },
    profileInfo: {
        marginLeft: 10,
        flex: 1,
    },
    profileName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#fff',
    },
    profileId: {
        fontSize: 13,
        color: '#fff',
        marginTop: 2,
    },
    logo: {
        width: 100,
        height: 100,
    },
    managerImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        // marginRight: 15,
    },
});

export default CustomDrawerContent;
