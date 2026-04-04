import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Modal,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const RegularizationConfirmationModal = ({
    visible,
    onClose,
    onConfirm,
    isLoading = false,
    title = 'Confirmation',
    message = 'Are you sure?',
    confirmText = 'Confirm',
    confirmButtonColor = '#3b82f6',
    hideComments = false,
}) => {
    const [comments, setComments] = useState('');
    const [error, setError] = useState('');

    const resetForm = useCallback(() => {
        setComments('');
        setError('');
    }, []);

    const handleConfirm = useCallback(() => {
        // Validate comments if not hidden
        if (!hideComments && !comments.trim()) {
            setError('Comments are required');
            return;
        }
        setError('');
        // Call parent callback with comments
        onConfirm(comments.trim());
    }, [comments, hideComments, onConfirm]);

    const handleClose = useCallback(() => {
        resetForm();
        onClose();
    }, [onClose, resetForm]);

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>{title}</Text>
                        <TouchableOpacity
                            onPress={handleClose}
                            disabled={isLoading}
                            style={styles.closeBtn}
                        >
                            <Icon name="close" size={24} color="#374151" />
                        </TouchableOpacity>
                    </View>

                    {/* Body */}
                    <View style={styles.body}>
                        {/* Message */}
                        <Text style={styles.message}>{message}</Text>

                        {/* Comments Input */}
                        {!hideComments && (
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Comments <Text style={styles.required}>*</Text></Text>
                                <TextInput
                                    style={[styles.input, error ? styles.inputError : null]}
                                    placeholder="Enter your comments..."
                                    placeholderTextColor="#9ca3af"
                                    multiline
                                    numberOfLines={4}
                                    value={comments}
                                    onChangeText={(text) => {
                                        setComments(text);
                                        if (error) setError('');
                                    }}
                                    editable={!isLoading}
                                    textAlignVertical="top"
                                />
                                {error && (
                                    <Text style={styles.errorText}>{error}</Text>
                                )}
                            </View>
                        )}
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={handleClose}
                            disabled={isLoading}
                        >
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.confirmBtn,
                                { backgroundColor: confirmButtonColor },
                                isLoading && styles.disabledBtn,
                            ]}
                            onPress={handleConfirm}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.confirmText}>{confirmText}</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    modal: {
        backgroundColor: '#fff',
        borderRadius: 12,
        minWidth: '80%',
        maxWidth: '95%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1f2937',
        flex: 1,
    },
    closeBtn: {
        padding: 4,
    },
    body: {
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    message: {
        fontSize: 14,
        color: '#374151',
        lineHeight: 20,
        marginBottom: 16,
    },
    inputContainer: {
        marginTop: 8,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 6,
    },
    required: {
        color: '#ef4444',
        fontWeight: '700',
    },
    input: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 13,
        color: '#374151',
        backgroundColor: '#f9fafb',
    },
    inputError: {
        borderColor: '#ef4444',
        backgroundColor: '#fef2f2',
    },
    errorText: {
        fontSize: 12,
        color: '#ef4444',
        marginTop: 6,
        fontWeight: '500',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    cancelBtn: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#d1d5db',
        minWidth: 100,
        alignItems: 'center',
    },
    cancelText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
    },
    confirmBtn: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 6,
        minWidth: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#fff',
        letterSpacing: 0.3,
    },
    disabledBtn: {
        opacity: 0.6,
    },
});

export default RegularizationConfirmationModal;
