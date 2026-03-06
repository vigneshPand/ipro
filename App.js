import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';

import { GestureHandlerRootView } from 'react-native-gesture-handler';

function App() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <NavigationContainer>
                    <AppNavigator />
                </NavigationContainer>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}

export default App;
