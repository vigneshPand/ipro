import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../../utils/theme';

const ReportsToSection = ({ managerInfo, ccList, selectedCC, setSelectedCC, hideCCField = false }) => {
    const [ccSearch, setCCSearch] = useState("");
    const [showCCDropdown, setShowCCDropdown] = useState(false);

    const filteredCC = ccList.filter(user =>
        user?.name?.toLowerCase().includes(ccSearch.toLowerCase())
    );

    const handleSelectCC = (user) => {
        const exists = selectedCC.find(item => item.userId === user.userId);
        if (!exists) {
            setSelectedCC([...selectedCC, user]);
        }
        setCCSearch("");
        setShowCCDropdown(false);
    };

    const removeCC = (userId) => {
        const updated = selectedCC.filter(item => item.userId !== userId);
        setSelectedCC(updated);
    };

    return (
        <View style={styles.reportsToSection}>
            {!hideCCField && (
                <>
                    <View style={styles.reportsToHeader}>
                        <Text style={styles.label}>Reports to</Text>
                        <View style={styles.searchContainer}>
                            <TextInput
                                placeholder="Search CC member"
                                placeholderTextColor="#9ca3af"
                                value={ccSearch}
                                onFocus={() => setShowCCDropdown(true)}
                                onChangeText={(text) => {
                                    setCCSearch(text);
                                    setShowCCDropdown(true);
                                }}
                                style={styles.ccSearchInput}
                            />
                            {showCCDropdown && ccSearch.trim().length > 0 && (
                                <View style={styles.dropdownList}>
                                    <ScrollView nestedScrollEnabled={true}>
                                        {filteredCC.length > 0 ? (
                                            filteredCC.map(user => (
                                                <TouchableOpacity
                                                    key={user.userId}
                                                    style={styles.dropdownItem}
                                                    onPress={() => handleSelectCC(user)}
                                                >
                                                    <Text style={styles.dropdownItemText}>{user.name}</Text>
                                                </TouchableOpacity>
                                            ))
                                        ) : (
                                            <View style={styles.dropdownItem}>
                                                <Text style={styles.dropdownItemText}>No members found</Text>
                                            </View>
                                        )}
                                    </ScrollView>
                                </View>
                            )}
                        </View>
                    </View>

                    <View style={styles.ccChipContainer}>
                        {selectedCC.map(user => (
                            <View key={user.userId} style={styles.ccChip}>
                                <Text style={styles.ccChipText}>{user.name}</Text>
                                <TouchableOpacity onPress={() => removeCC(user.userId)} style={styles.removeIcon}>
                                    <Icon name="close" size={14} color="#6b7280" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                </>
            )}

            <View style={styles.managerProfileRow}>
                {managerInfo.profile ? (
                    <Image
                        source={{ uri: `data:image/jpeg;base64,${managerInfo.profile}` }}
                        style={styles.avatarImage}
                    />
                ) : (
                    <View style={styles.avatarPlaceholder} />
                )}
                <View style={styles.managerTextCol}>
                    <Text style={styles.managerName}>{managerInfo.name}</Text>
                    <Text style={styles.managerDesig}>{managerInfo.designation}</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    reportsToSection: {
        marginTop: 5,
        zIndex: 1,
        elevation: 1,
    },
    reportsToHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    label: {
        fontSize: 14,
        color: COLORS.darkText,
        fontWeight: '600',
    },
    searchContainer: {
        width: 160,
        position: 'relative',
        zIndex: 50,
    },
    ccSearchInput: {
        height: 34,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 6,
        paddingHorizontal: 8,
        fontSize: 12,
        color: COLORS.darkText,
        backgroundColor: COLORS.white,
    },
    dropdownList: {
        position: 'absolute',
        top: 36,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 6,
        maxHeight: 150,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        zIndex: 100,
    },
    dropdownItem: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    dropdownItemText: {
        fontSize: 12,
        color: COLORS.darkText,
    },
    ccChipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 8,
    },
    ccChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        borderRadius: 16,
        paddingHorizontal: 10,
        paddingVertical: 4,
        marginRight: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    ccChipText: {
        fontSize: 12,
        color: COLORS.darkText,
        marginRight: 4,
    },
    removeIcon: {
        marginLeft: 2,
    },
    managerProfileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    avatarImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#cbd5e1',
        marginRight: 10,
    },
    managerTextCol: {
        justifyContent: 'center',
    },
    managerName: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.darkText,
    },
    managerDesig: {
        fontSize: 11,
        color: COLORS.grayText,
    },
});

export default ReportsToSection;
