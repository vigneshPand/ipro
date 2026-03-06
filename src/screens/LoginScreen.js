import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    ScrollView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AuthService from '../services/AuthService';
import LoadingOverlay from '../components/LoadingOverlay';
import { COLORS, SHADOW } from '../utils/theme';

const LoginScreen = ({ navigation }) => {
    const [isAzureLoading, setIsAzureLoading] = useState(false);

    const [overlay, setOverlay] = useState({
        visible: false,
        message: '',
        type: 'loading',
        onConfirm: null,
        onCancel: null
    });

    const hideOverlay = useCallback(() => setOverlay(prev => ({ ...prev, visible: false })), []);
    const showLoading = useCallback((message = 'Authenticating...') => setOverlay({ visible: true, message, type: 'loading' }), []);
    const showError = useCallback((message) => setOverlay({ visible: true, message, type: 'error', onConfirm: hideOverlay }), [hideOverlay]);

    useEffect(() => {
        (async () => {
            const token = await AuthService.isAuthenticated();
            if (token) {
                const userInfo = await AuthService.getUserInfo();
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Main', params: userInfo }],
                });
            }
        })();
    }, [navigation]);

    const handleMicrosoftLogin = async () => {
        setIsAzureLoading(true);
        let azureToken = null;

        try {
            azureToken = await AuthService.login();

            showLoading('Authenticating...');
            await AuthService.exchangeToken(azureToken);
            const userData = await AuthService.getAuthenticatedUser();

            hideOverlay();

            navigation.reset({
                index: 0,
                routes: [{
                    name: 'Main',
                    params: userData
                }],
            });

        } catch (error) {
            console.error('Authentication Flow Error:', error);
            showError('Login failed. Please try again.');
            await AuthService.signOut();
        } finally {
            setIsAzureLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.headerSpacer} />

                <View style={styles.logoContainer}>
                    <Image
                        source={require('../assets/iPro_white.png')}
                        resizeMode='contain'
                        style={styles.logo}
                    />
                </View>

                <View style={styles.content}>
                    <View style={styles.card}>
                        <Text style={styles.title}>Login to your account</Text>
                        <Text style={styles.subtitle}>
                            Login with your organization's email and password through below Microsoft login
                        </Text>

                        <TouchableOpacity
                            style={styles.microsoftButton}
                            onPress={handleMicrosoftLogin}
                            disabled={isAzureLoading || overlay.visible}
                        >
                            {isAzureLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <View style={styles.buttonContent}>
                                    <Image
                                        source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg' }}
                                        style={styles.msIcon}
                                        resizeMode="contain"
                                    />
                                    <Text style={styles.buttonText}>Sign in with Microsoft</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>2026. All Rights Reserved.</Text>
                </View>
            </ScrollView>

            <LoadingOverlay {...overlay} />
        </SafeAreaView>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.secondary,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
    },
    headerSpacer: {
        height: Platform.OS === 'ios' ? 20 : 40, // Reduced space as SafeAreaView handles top inset
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    logo: {
        width: 140,
        height: 140,
    },
    content: {
        flex: 1,
        justifyContent: 'flex-start',
    },
    card: {
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        borderRadius: 20,
        padding: 30,
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        ...SHADOW,
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.white,
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 20,
    },
    footer: {
        paddingVertical: 30,
        alignItems: 'center',
    },
    footerText: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 12,
        fontWeight: '500',
    },
    microsoftButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 10,
        width: '100%',
        ...SHADOW,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    msIcon: {
        width: 20,
        height: 20,
        marginRight: 12,
    },
    buttonText: {
        fontSize: 16,
        color: COLORS.white,
        fontWeight: '600',
    }
});

export default LoginScreen;
