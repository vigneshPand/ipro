module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    'react-native-reanimated/plugin',
    // Strip all console.* calls from the production release bundle
    ...(process.env.NODE_ENV === 'production' ? ['transform-remove-console'] : []),
  ],
};
