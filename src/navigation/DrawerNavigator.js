import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import HomeScreen from '../screens/HomeScreen';
import CustomDrawerContent from './CustomDrawerContent';
import LeaveRequestScreen from '../screens/leave/LeaveRequest';
import LeaveHistoryScreen from '../screens/leave/LeaveHistory';
import CompOffHistoryScreen from '../screens/leave/comp-off/CompOffHistoryScreen';
import HolidayScreen from '../screens/holiday/HolidayScreen';
import CompOffGrantScreen from '../screens/leave/comp-off/CompOffGrantScreen';
import WFHRequestScreen from '../screens/wfh/WFHRequest';
import WFHHistoryScreen from '../screens/wfh/WFHHistory';
import AttendanceGridScreen from '../screens/attendance/AttendanceGrid';
import RegularizationHistoryScreen from '../screens/regularization/RegularizationHistoryScreen';
import TeamLeaveRequestsScreen from '../screens/leave/TeamLeaveRequestsScreen';
import TeamRegularizationScreen from '../screens/regularization/TeamRegularizationScreen';
import TeamWFHScreen from '../screens/wfh/TeamWFHScreen';

const Drawer = createDrawerNavigator();

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
                    backgroundColor: '#3E699B', // Match CustomDrawerContent background
                },
            }}
        >
            <Drawer.Screen
                name="Home"
                component={HomeScreen}
                initialParams={userParams}
            />

            {/* Sub-menu hidden screens */}
            <Drawer.Screen name="Attendance Grid" component={AttendanceGridScreen} />
            <Drawer.Screen name="Holidays" component={HolidayScreen} />
            <Drawer.Screen name="LeaveRequest" component={LeaveRequestScreen} />
            <Drawer.Screen name="LeaveHistory" component={LeaveHistoryScreen} />
            <Drawer.Screen name="WFHRequest" component={WFHRequestScreen} />
            <Drawer.Screen name="WFHHistory" component={WFHHistoryScreen} />
            <Drawer.Screen name="CompOffGrantRequest" component={CompOffGrantScreen} />
            <Drawer.Screen name="CompOffHistory" component={CompOffHistoryScreen} />
            <Drawer.Screen name="Regularization" component={RegularizationHistoryScreen} />
            <Drawer.Screen name="TeamLeaveRequests" component={TeamLeaveRequestsScreen} />
            <Drawer.Screen name="TeamRegularization" component={TeamRegularizationScreen} />
            <Drawer.Screen name="TeamWFH" component={TeamWFHScreen} />
        </Drawer.Navigator>
    );
};

export default DrawerNavigator;
