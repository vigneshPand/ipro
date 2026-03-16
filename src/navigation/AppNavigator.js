import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import DrawerNavigator from './DrawerNavigator';
import LeaveApplyScreen from '../screens/leave/LeaveApply';
import CompOffApplyScreen from '../screens/leave/comp-off/CompOffApplyScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
    return (
        <Stack.Navigator
            initialRouteName="Login"
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Main" component={DrawerNavigator} />

            {/* Modal Screens */}
            <Stack.Screen
                name="LeaveApply"
                component={LeaveApplyScreen}
                options={{ presentation: 'transparentModal', animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
                name="CompOffApply"
                component={CompOffApplyScreen}
                options={{ presentation: 'transparentModal', animation: 'slide_from_bottom' }}
            />
        </Stack.Navigator>
    );
};

export default AppNavigator;
