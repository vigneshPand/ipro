import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ActivityIndicator,
} from 'react-native';
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

    const hideOverlay = () => setOverlay(prev => ({ ...prev, visible: false }));
    const showLoading = (message = 'Authenticating...') => setOverlay({ visible: true, message, type: 'loading' });
    const showError = (message) => setOverlay({ visible: true, message, type: 'error', onCancel: hideOverlay });

    useEffect(() => {
        (async () => {
            const token = await AuthService.isAuthenticated();
            if (token) {
                const userInfo = await AuthService.getUserInfo();
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Home', params: userInfo }],
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
                    name: 'Home',
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
        <View style={styles.container}>
            <View style={styles.content}>
                <View style={styles.logoSection}>
                    <Text style={styles.logoText}>ipro</Text>
                </View>

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
                            <ActivityIndicator color={COLORS.primary} />
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

                <Text style={styles.footerText}>2026. All Rights Reserved.</Text>
            </View>

            <LoadingOverlay {...overlay} />
        </View>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.secondary,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: COLORS.white,
    },
    logoSection: {
        marginBottom: 40,
    },
    logoText: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#333',
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 30,
        width: '100%',
        ...SHADOW,
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: COLORS.primary,
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 20,
    },
    microsoftButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#ccc',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 4,
        width: '100%',
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
        color: '#333',
        fontWeight: '500',
    },
    footerText: {
        position: 'absolute',
        bottom: 30,
        color: '#999',
        fontSize: 12,
    },
});

export default LoginScreen;
