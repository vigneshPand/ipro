/* eslint-disable no-undef */
require('react-native-gesture-handler/jestSetup');

jest.mock('react-native-reanimated', () => {
    const Reanimated = require('react-native-reanimated/mock');

    // The mock for `call` should be a function
    Reanimated.default.call = () => { };

    return Reanimated;
});

// Silence the warning: Animated: `useNativeDriver` is not supported because the native animated module is missing
// jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('react-native-keychain', () => ({
    setGenericPassword: jest.fn(),
    getGenericPassword: jest.fn(),
    resetGenericPassword: jest.fn(),
}));

jest.mock('react-native-geolocation-service', () => ({
    getCurrentPosition: jest.fn(),
    requestAuthorization: jest.fn(),
    stopObserving: jest.fn(),
}));

jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');
jest.mock('react-native-vector-icons/SimpleLineIcons', () => 'Icon');
