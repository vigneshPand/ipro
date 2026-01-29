import React, { useEffect, useRef } from 'react';
import {
    StyleSheet,
    Animated,
    Text,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { COLORS } from '../utils/theme';

const { width, height } = Dimensions.get('window');

const LoadingOverlay = ({ visible, message, showCheckInButton }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
                })
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 0.9,
                    duration: 300,
                    useNativeDriver: true,
                })
            ]).start();
        }
    }, [visible, fadeAnim, scaleAnim]);

    if (!visible) return null;

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            <Animated.View style={[styles.content, { transform: [{ scale: scaleAnim }] }]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.message}>
                    {message || (showCheckInButton !== undefined ? (showCheckInButton ? 'Checking In...' : 'Checking Out...') : 'Authenticating...')}
                </Text>
            </Animated.View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        width,
        height,
    },
    content: {
        padding: 30,
        backgroundColor: '#fff',
        borderRadius: 15,
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    message: {
        marginTop: 15,
        fontSize: 16,
        color: COLORS.text,
        fontWeight: '600',
    },
});

export default LoadingOverlay;
