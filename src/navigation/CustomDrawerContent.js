import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Icons from 'react-native-vector-icons/SimpleLineIcons';
import { COLORS } from '../utils/theme';
import AuthService from '../services/AuthService';

// UIManager.setLayoutAnimationEnabledExperimental is a no-op in New Architecture


const CustomDrawerContent = (props) => {
    const [isLeaveExpanded, setIsLeaveExpanded] = useState(false);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    // Get active route name
    const { state, navigation } = props;
    const activeRoute = state.routeNames[state.index];

    useEffect(() => {
        loadUserProfile();
    }, []);

    const loadUserProfile = async () => {
        setLoading(true);
        const profile = await AuthService.getUserInfo(); // Call your existing method
        setUserProfile(profile);
        setLoading(false);
    };

    const toggleLeaveMenu = () => {
        setIsLeaveExpanded(!isLeaveExpanded);
    };

    const handleLogout = async () => {
        try {
            await AuthService.signOut();
            const parent = navigation.getParent();
            if (parent) {
                parent.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                });
            } else {
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const navigateTo = (screenName) => {
        navigation.navigate(screenName);
    };

    const isLeaveSubMenu = ['Holidays', 'LeaveRequest', 'LeaveHistory', 'CompOffGrantRequest', 'CompOffHistory'].includes(activeRoute);

    return (
        <View style={styles.container}>
            {/* Header / Logo Section */}
            <View style={styles.header}>
                {/* Placeholder for ipro logo */}
                <View style={styles.logoContainer}>
                    <Image
                        source={require('../assets/iPro_white.png')}
                        resizeMode='contain'
                        style={styles.logo}
                    />
                </View>
            </View>

            {/* Menu Items */}
            <DrawerContentScrollView {...props} contentContainerStyle={styles.scrollContent}>

                {/* Dashboard Item */}
                <TouchableOpacity
                    style={[styles.menuItem, activeRoute === 'Home' && styles.activeMenuItem]}
                    onPress={() => navigateTo('Home')}
                >
                    <Icon name="view-dashboard-outline" size={24} color={activeRoute === 'Home' ? COLORS.primary : '#fff'} />
                    <Text style={[styles.menuText, activeRoute === 'Home' && styles.activeMenuText]}>Dashboard</Text>
                </TouchableOpacity>

                {/* Leave Accordion */}
                <TouchableOpacity
                    style={[styles.menuItem, isLeaveSubMenu && !isLeaveExpanded && styles.activeMenuItem]}
                    onPress={toggleLeaveMenu}
                >
                    <Icon name="calendar-blank-outline" size={24} color={(isLeaveSubMenu && !isLeaveExpanded) ? COLORS.primary : '#fff'} />
                    <Text style={[styles.menuText, (isLeaveSubMenu && !isLeaveExpanded) && styles.activeMenuText]}>Leave</Text>
                    <Icon name={isLeaveExpanded ? 'chevron-up' : 'chevron-down'} size={24} color='#fff' style={styles.chevronIcon} />
                </TouchableOpacity>

                {/* Expanded Sub-Menu Items */}
                {isLeaveExpanded && (
                    <View style={styles.subMenuContainer}>
                        <TouchableOpacity style={[styles.subMenuItem, activeRoute === 'Holidays' && styles.activeSubMenuItem]} onPress={() => navigateTo('Holidays')}>
                            {/* <Icon name="circle-medium" size={16} color={activeRoute === 'Holidays' ? COLORS.primary : '#666'} /> */}
                            <Text style={[styles.subMenuText, activeRoute === 'Holidays' && styles.activeMenuText]}>Holidays</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.subMenuItem, activeRoute === 'LeaveRequest' && styles.activeSubMenuItem]} onPress={() => navigateTo('LeaveRequest')}>
                            {/* <Icon name="circle-medium" size={16} color={activeRoute === 'LeaveRequest' ? COLORS.primary : '#666'} /> */}
                            <Text style={[styles.subMenuText, activeRoute === 'LeaveRequest' && styles.activeMenuText]}>Leave Request</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.subMenuItem, activeRoute === 'LeaveHistory' && styles.activeSubMenuItem]} onPress={() => navigateTo('LeaveHistory')}>
                            {/* <Icon name="circle-medium" size={16} color={activeRoute === 'LeaveHistory' ? COLORS.primary : '#666'} /> */}
                            <Text style={[styles.subMenuText, activeRoute === 'LeaveHistory' && styles.activeMenuText]}>Leave History</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.subMenuItem, activeRoute === 'CompOffGrantRequest' && styles.activeSubMenuItem]} onPress={() => navigateTo('CompOffGrantRequest')}>
                            {/* <Icon name="circle-medium" size={16} color={activeRoute === 'CompOffGrantRequest' ? COLORS.primary : '#666'} /> */}
                            <Text style={[styles.subMenuText, activeRoute === 'CompOffGrantRequest' && styles.activeMenuText]}>Comp-Off Grant Request</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.subMenuItem, activeRoute === 'CompOffHistory' && styles.activeSubMenuItem]} onPress={() => navigateTo('CompOffHistory')}>
                            {/* <Icon name="circle-medium" size={16} color={activeRoute === 'CompOffHistory' ? COLORS.primary : '#666'} /> */}
                            <Text style={[styles.subMenuText, activeRoute === 'CompOffHistory' && styles.activeMenuText]}>Comp-Off History</Text>
                        </TouchableOpacity>
                    </View>
                )}
                {/* <View style={styles.logoutContainer}>

                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <Icon name="logout" size={24} color={COLORS.error || '#d32f2f'} />
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                </View> */}
            </DrawerContentScrollView>

            {/* Logout Button above Footer */}
            <View style={styles.logoutContainer}>
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Icons name="logout" size={22} color={COLORS.error} />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            {/* Persistent Profile Footer */}
            <View style={styles.footer}>
                <View style={styles.avatarContainer}>
                    {userProfile?.profile && (
                        <Image
                            source={{ uri: `data:image/jpeg;base64,${userProfile?.profile}` }}
                            style={styles.managerImage}
                        />
                    )}
                </View>
                <View style={styles.profileInfo}>
                    <Text style={styles.profileName} numberOfLines={1}>{userProfile?.displayName}</Text>
                    <Text style={styles.profileId}>{userProfile?.empId}</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#3E699B',
    },
    header: {
        marginTop: 20,
        paddingBottom: 20,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 120, // To give it breathing room
    },
    logoContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        paddingTop: 10,
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
        padding: 20,
        backgroundColor: '#3E699B',
        // borderTopWidth: 1,
        // borderTopColor: '#e0e0e0',
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
