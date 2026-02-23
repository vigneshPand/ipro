import React, { useEffect, useRef } from 'react';
import {
    StyleSheet,
    Animated,
    Text,
    ActivityIndicator,
    Dimensions,
    View,
    TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../utils/theme';

const { width, height } = Dimensions.get('window');

const LoadingOverlay = ({
    visible,
    message,
    type = 'loading', // 'loading', 'success', 'error', 'confirm'
    onConfirm,
    onCancel,
    confirmText = 'OK',
    cancelText = 'Cancel',
}) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;

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
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 0.8,
                    duration: 200,
                    useNativeDriver: true,
                })
            ]).start(() => {
                // Animation finished
            });
        }
    }, [visible, fadeAnim, scaleAnim]);

    if (!visible) return null;

    const renderIcon = () => {
        switch (type) {
            case 'success':
                return <Icon name="check-circle" size={50} color={COLORS.success} />;
            case 'error':
                return <Icon name="close-circle" size={50} color={COLORS.error} />;
            case 'confirm':
                return <Icon name="help-circle" size={50} color={COLORS.primary} />;
            case 'loading':
            default:
                return <ActivityIndicator size="large" color={COLORS.primary} />;
        }
    };

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            <Animated.View style={[styles.content, { transform: [{ scale: scaleAnim }] }]}>
                <View style={styles.iconContainer}>
                    {renderIcon()}
                </View>

                <Text style={styles.message}>{message}</Text>

                <View style={styles.buttonContainer}>
                    {(type === 'confirm' || type === 'error' || type === 'success') && (
                        <TouchableOpacity
                            style={[
                                styles.button,
                                type === 'error' ? styles.errorButton :
                                    type === 'success' ? styles.successButton :
                                        styles.confirmButton
                            ]}
                            onPress={onConfirm || onCancel}
                        >
                            <Text style={styles.buttonText}>{confirmText}</Text>
                        </TouchableOpacity>
                    )}

                    {type === 'confirm' && (
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={onCancel}
                        >
                            <Text style={styles.cancelButtonText}>{cancelText}</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </Animated.View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        width,
        height,
    },
    content: {
        width: width * 0.8,
        padding: 25,
        backgroundColor: '#fff',
        borderRadius: 20,
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.34,
        shadowRadius: 6.27,
    },
    iconContainer: {
        marginBottom: 15,
    },
    message: {
        fontSize: 16,
        color: COLORS.text,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 22,
    },
    buttonContainer: {
        width: '100%',
        flexDirection: 'column',
        gap: 10,
    },
    button: {
        width: '100%',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmButton: {
        backgroundColor: COLORS.primary,
    },
    successButton: {
        backgroundColor: COLORS.success,
    },
    errorButton: {
        backgroundColor: COLORS.error,
    },
    cancelButton: {
        backgroundColor: '#f0f0f0',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    cancelButtonText: {
        color: '#333',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default LoadingOverlay;
