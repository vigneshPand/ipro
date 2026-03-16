import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import DocumentPicker, { types } from 'react-native-document-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import RNFS from 'react-native-fs';

const COLORS = {
    red: '#d32f2f',
    grayText: '#6b7280',
    blue: '#4171ea',
};

const AttachFilePicker = ({ onFileSelected, onError, label }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleAttachFile = async () => {
        try {
            const result = await DocumentPicker.pickSingle({
                type: [types.images, types.pdf, types.doc],
            });

            const allowedTypes = [
                "image/jpg",
                "image/png",
                "application/pdf",
                "application/msword"
            ];

            if (!allowedTypes.includes(result.type)) {
                if (onError) onError('Only JPG, PNG, PDF, and DOC files are allowed.');
                return;
            }

            const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
            if (result.size && result.size > MAX_SIZE) {
                if (onError) onError('File size exceeds 5MB limit.');
                return;
            }

            setIsProcessing(true);
            const base64Data = await RNFS.readFile(result.uri, "base64");

            const fileDataObj = {
                fileName: result.name,
                fileType: result.type,
                fileData: base64Data
            };

            setSelectedFile(fileDataObj);
            if (onFileSelected) {
                onFileSelected(fileDataObj);
            }
        } catch (err) {
            if (DocumentPicker.isCancel(err)) {
                // User cancelled the picker
            } else {
                console.warn(err);
                if (onError) onError('Failed to process file.');
            }
        } finally {
            setIsProcessing(false);
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
                        {selectedFile.fileName}
                    </Text>
                    <TouchableOpacity onPress={handleRemoveFile} style={styles.removeButton}>
                        <Icon name="close" size={18} color={COLORS.red} />
                    </TouchableOpacity>
                </View>
            ) : isProcessing ? (
                <View style={styles.attachBox}>
                    <ActivityIndicator size="small" color={COLORS.blue} />
                    <Text style={[styles.attachText, styles.processingText]}>Processing file...</Text>
                </View>
            ) : (
                <TouchableOpacity style={styles.attachBox} onPress={handleAttachFile}>
                    <Text style={styles.attachText}><Text style={styles.asterisk}>+ </Text>{label || 'Attach File (jpg, png, pdf, doc)'}</Text>
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
        width: '95%',
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
    processingText: {
        marginTop: 4,
    },
});

export default AttachFilePicker;
