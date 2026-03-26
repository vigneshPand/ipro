import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import AppModal from '../common/AppModal';
import { COLORS } from '../../utils/theme';

const WithdrawConfirmationModal = ({
    visible,
    onClose,
    onConfirm,
    isLoading,
    isRegularize,
    title = 'Withdraw Confirmation',
    message = 'Are you sure you want to withdraw this request?',
    confirmText = 'OK',
}) => {
    const [remarks, setRemarks] = useState('');
    const [error, setError] = useState('');

    const handleConfirm = () => {
        if (!isRegularize && !remarks.trim()) {
            setError('Remarks are required');
            return;
        }
        setError('');
        onConfirm(remarks);
    };

    const handleClose = () => {
        setRemarks('');
        setError('');
        onClose();
    };

    return (
        <AppModal
            visible={visible}
            onClose={handleClose}
            title={title}
            animationType="fade"
            position="center"
            headerStyle={styles.header}
            titleStyle={styles.headerTitle}
            closeIconColor="#fff"
        >
            <View style={styles.body}>
                <Text style={styles.messageText}>
                    {message}
                </Text>
                {!isRegularize && (
                    <TextInput
                        style={[styles.input, error ? styles.inputError : null]}
                        placeholder="Enter remarks"
                        placeholderTextColor="#9ca3af"
                        multiline
                        numberOfLines={4}
                        value={remarks}
                        onChangeText={(text) => {
                            setRemarks(text);
                            if (error) setError('');
                        }}
                        editable={!isLoading}
                    />
                )}
                {isRegularize ? null : error ? <Text style={styles.errorText}>{error}</Text> : null}

                {/* Footer Buttons */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={handleClose}
                        disabled={isLoading}
                    >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.okButton, isLoading && styles.disabledButton]}
                        onPress={handleConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.okButtonText}>{confirmText}</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </AppModal>
    );
};

const styles = StyleSheet.create({
    header: {
        backgroundColor: COLORS.blue,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    body: {
        padding: 20,
    },
    messageText: {
        color: COLORS.blue,
        fontSize: 15,
        textAlign: 'left',
        marginBottom: 20,
        fontWeight: '500',
    },
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 6,
        padding: 12,
        height: 80,
        textAlignVertical: 'top',
        color: '#374151',
        fontSize: 14,
        marginBottom: 8,
    },
    inputError: {
        borderColor: COLORS.red,
    },
    errorText: {
        color: COLORS.red,
        fontSize: 12,
        marginBottom: 12,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 10,
        gap: 12,
    },
    cancelButton: {
        borderWidth: 1,
        borderColor: COLORS.red,
        backgroundColor: '#fff',
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 6,
        minWidth: 80,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: COLORS.red,
        fontWeight: '600',
        fontSize: 14,
    },
    okButton: {
        backgroundColor: COLORS.blue,
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 6,
        minWidth: 80,
        alignItems: 'center',
        justifyContent: 'center',
    },
    disabledButton: {
        opacity: 0.7,
    },
    okButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
});

export default WithdrawConfirmationModal;
