import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { COLORS } from '../../utils/theme';

const WFHCheckInConfirmModal = ({
    visible,
    onClose,
    onConfirm,
    isLoading = false,
}) => {
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    {/* Title */}
                    <Text style={styles.title}>Confirmation</Text>

                    {/* Message */}
                    <Text style={styles.message}>
                        You're not assigned with WFH location. Do you want to apply WFH request?
                    </Text>

                    {/* Button Container */}
                    <View style={styles.buttonContainer}>
                        {/* No Button */}
                        <TouchableOpacity
                            style={styles.noButton}
                            onPress={onClose}
                            disabled={isLoading}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.noButtonText}>No</Text>
                        </TouchableOpacity>

                        {/* Yes Button */}
                        <TouchableOpacity
                            style={[styles.yesButton, isLoading && styles.disabledButton]}
                            onPress={onConfirm}
                            disabled={isLoading}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.yesButtonText}>Yes</Text>
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
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 24,
        paddingVertical: 28,
        width: '85%',
        maxWidth: 340,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.darkText,
        textAlign: 'center',
        marginBottom: 16,
    },
    message: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.grayText,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 28,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        justifyContent: 'center',
    },
    noButton: {
        borderWidth: 1.5,
        borderColor: COLORS.red,
        backgroundColor: '#fff',
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 6,
        minWidth: 90,
        alignItems: 'center',
        justifyContent: 'center',
    },
    noButtonText: {
        color: COLORS.red,
        fontSize: 14,
        fontWeight: '600',
    },
    yesButton: {
        backgroundColor: COLORS.blue,
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 6,
        minWidth: 90,
        alignItems: 'center',
        justifyContent: 'center',
    },
    yesButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    disabledButton: {
        opacity: 0.6,
    },
});

export default WFHCheckInConfirmModal;
