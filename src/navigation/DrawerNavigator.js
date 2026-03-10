import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import HomeScreen from '../screens/HomeScreen';
import CustomDrawerContent from './CustomDrawerContent';
import LeaveRequestScreen from '../screens/leave/LeaveRequest';
import LeaveHistoryScreen from '../screens/leave/LeaveHistory';
import CompOffHistoryScreen from '../screens/leave/CompOffHistoryScreen';
import HolidayScreen from '../screens/holiday/HolidayScreen';

const Drawer = createDrawerNavigator();

// Placeholder screens for sub-menu items to prevent crashes
const PlaceholderScreen = ({ route }) => (
    <View style={styles.placeholderContainer}>
        <Text style={styles.placeholderText}>{route.name} Screen</Text>
        <Text style={styles.placeholderSub}>This feature is coming soon.</Text>
    </View>
);

const styles = StyleSheet.create({
    placeholderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    placeholderText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    placeholderSub: {
        fontSize: 16,
        color: '#666',
    },
});

const DrawerNavigator = ({ route }) => {
    const userParams = route?.params || {};

    return (
        <Drawer.Navigator
            initialRouteName="Home"
            drawerContent={CustomDrawerContent}
            screenOptions={{
                headerShown: false,
                drawerStyle: {
                    width: '75%', // Standard drawer width
                },
            }}
        >
            <Drawer.Screen
                name="Home"
                component={HomeScreen}
                initialParams={userParams}
            />

            {/* Sub-menu hidden screens */}
            <Drawer.Screen name="Holidays" component={HolidayScreen} />
            <Drawer.Screen name="LeaveRequest" component={LeaveRequestScreen} />
            <Drawer.Screen name="LeaveHistory" component={LeaveHistoryScreen} />
            <Drawer.Screen name="CompOffGrantRequest" component={PlaceholderScreen} />
            <Drawer.Screen name="CompOffHistory" component={CompOffHistoryScreen} />
        </Drawer.Navigator>
    );
};

export default DrawerNavigator;
