import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const AppModal = ({
    visible,
    onClose,
    title,
    children,
    heightPercentage,
    animationType = 'slide',
    transparent = true,
    position = 'bottom',
    headerStyle,
    closeIconColor = '#374151',
    titleStyle
}) => {
    const isCenter = position === 'center';

    return (
        <Modal
            visible={visible}
            transparent={transparent}
            animationType={animationType}
            onRequestClose={onClose}
        >
            <View style={[styles.modalOverlay, isCenter && styles.modalOverlayCenter]}>
                <View style={[
                    styles.modalCard,
                    isCenter && styles.modalCardCenter,
                    heightPercentage && { maxHeight: heightPercentage }
                ]}>
                    <View style={[styles.header, headerStyle]}>
                        <Text style={[styles.headerTitle, titleStyle]}>{title}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Icon name={isCenter ? "close-circle" : "close"} size={24} color={closeIconColor} />
                        </TouchableOpacity>
                    </View>
                    {children}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalOverlayCenter: {
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    modalCard: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        paddingBottom: 20,
        width: '100%',
    },
    modalCardCenter: {
        borderRadius: 8,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    closeBtn: {
        padding: 4,
    },
});

export default AppModal;
