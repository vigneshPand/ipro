import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import DocumentPicker, { types } from 'react-native-document-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const COLORS = {
    red: '#d32f2f',
    grayText: '#6b7280',
    blue: '#4171ea',
};

const AttachFilePicker = ({ onFileSelected }) => {
    const [selectedFile, setSelectedFile] = useState(null);

    const handleAttachFile = async () => {
        try {
            const result = await DocumentPicker.pickSingle({
                type: [types.images, types.pdf, types.doc, types.docx],
            });
            setSelectedFile(result);
            if (onFileSelected) {
                onFileSelected(result);
            }
        } catch (err) {
            if (DocumentPicker.isCancel(err)) {
                // User cancelled the picker
            } else {
                console.warn(err);
            }
        }
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        if (onFileSelected) {
            onFileSelected(null);
        }
    };

    return (
        <View style={styles.container}>
            {selectedFile ? (
                <View style={styles.selectedFileBox}>
                    <Icon name="file-document-outline" size={20} color={COLORS.grayText} style={styles.fileIcon} />
                    <Text style={styles.fileNameText} numberOfLines={1} ellipsizeMode="middle">
                        {selectedFile.name}
                    </Text>
                    <TouchableOpacity onPress={handleRemoveFile} style={styles.removeButton}>
                        <Icon name="close" size={18} color={COLORS.red} />
                    </TouchableOpacity>
                </View>
            ) : (
                <TouchableOpacity style={styles.attachBox} onPress={handleAttachFile}>
                    <Text style={styles.attachText}><Text style={styles.asterisk}>+ </Text>Attach File (jpg, png, pdf, doc)</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    attachBox: {
        borderWidth: 1,
        borderColor: COLORS.blue,
        borderStyle: 'dashed',
        borderRadius: 6,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 52,
    },
    attachText: {
        color: COLORS.grayText,
        fontSize: 11,
    },
    asterisk: {
        color: COLORS.red,
    },
    selectedFileBox: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 6,
        padding: 12,
        backgroundColor: '#f9fafb',
        minHeight: 52,
    },
    fileIcon: {
        marginRight: 8,
    },
    fileNameText: {
        flex: 1,
        fontSize: 12,
        color: '#374151',
    },
    removeButton: {
        padding: 4,
        marginLeft: 8,
    },
});

export default AttachFilePicker;
