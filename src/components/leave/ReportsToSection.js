import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { COLORS } from '../../utils/theme';

const ReportsToSection = ({ managerInfo }) => {
    return (
        <View style={styles.reportsToSection}>
            <View style={styles.reportsToHeader}>
                <Text style={styles.label}>Reports to</Text>
                <View style={styles.searchBox}>
                    <Text style={styles.searchPlaceholder}>Search team member</Text>
                </View>
            </View>

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
    searchBox: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        width: 150,
    },
    searchPlaceholder: {
        color: '#9ca3af',
        fontSize: 12,
    },
    managerProfileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
    },
    avatarImage: {
        width: 45,
        height: 45,
        borderRadius: 22,
        marginRight: 12,
    },
    avatarPlaceholder: {
        width: 45,
        height: 45,
        borderRadius: 22,
        backgroundColor: '#cbd5e1',
        marginRight: 12,
    },
    managerTextCol: {
        justifyContent: 'center',
    },
    managerName: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.darkText,
    },
    managerDesig: {
        fontSize: 12,
        color: COLORS.grayText,
        marginTop: 2,
    },
});

export default ReportsToSection;
