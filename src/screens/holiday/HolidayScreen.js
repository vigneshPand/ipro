import React, { useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import moment from 'moment';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../../utils/theme';
import useHolidayStore from '../../store/useHolidayStore';
import AuthService from '../../services/AuthService';
import { DEFAULT_SHIFT } from '../../constants/Config';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 40) / 2;

const HolidayItem = ({ item }) => {
    const date = new Date(item.date);
    const day = date.getDate();
    const weekday = moment(item.date).format('ddd');

    return (
        <View style={styles.holidayItem}>
            <View style={styles.dateCircle}>
                <Text style={styles.dateDay}>{day}</Text>
                <Text style={styles.dateWeekday}>{weekday}</Text>
            </View>
            <Text style={styles.holidayName}>{item.holidaysName}</Text>
        </View>
    );
};

const HolidayMonthSection = ({ title, data }) => {
    return (
        <View style={styles.monthSection}>
            <View style={styles.monthHeader}>
                <Text style={styles.monthTitle}>{title}</Text>
                <View style={styles.underline} />
            </View>
            {data.map((item, index) => (
                <HolidayItem key={item.id || index} item={item} />
            ))}
        </View>
    );
};

const HolidayScreen = ({ navigation }) => {
    const { holidays, loading, fetchHolidays } = useHolidayStore();

    useEffect(() => {
        const loadData = async () => {
            const userInfo = await AuthService.getUserInfo();
            const year = new Date().getFullYear();
            if (userInfo?.userId) {
                fetchHolidays(year, userInfo.userId);
            }
        };
        loadData();
    }, [fetchHolidays]);

    const groupedData = useMemo(() => {
        const groups = holidays.reduce((acc, item) => {
            const month = moment(item.date).format('MMMM');
            if (!acc[month]) {
                acc[month] = [];
            }
            acc[month].push(item);
            return acc;
        }, {});

        const monthOrder = moment.months();
        return Object.keys(groups)
            .sort((a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b))
            .map(month => ({
                title: month,
                data: groups[month]
            }));
    }, [holidays]);

    const renderSubHeader = () => (
        <View style={styles.subHeaderContainer}>
            <Text style={styles.subTitle}>Holiday schedule for {new Date().getFullYear()} <Text style={styles.subTitleSpan}>(Shift: {DEFAULT_SHIFT.name})</Text></Text>
        </View>
    );

    if (loading && holidays.length === 0) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.menuButton}>
                        <Icon name="menu" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Holidays</Text>
                </View>
            </View>

            <FlatList
                data={groupedData}
                keyExtractor={(item) => item.title}
                renderItem={({ item }) => (
                    <HolidayMonthSection title={item.title} data={item.data} />
                )}
                numColumns={2}
                ListHeaderComponent={renderSubHeader}
                contentContainerStyle={styles.listContent}
                columnWrapperStyle={styles.columnWrapper}
                showsVerticalScrollIndicator={false}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={5}
                removeClippedSubviews={true}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 20,
        paddingTop: 10,
    },
    subHeaderContainer: {
        marginBottom: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#3E699B',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuButton: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 18,
        color: '#fff',
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    subTitle: {
        fontSize: 16,
        color: COLORS.primary,
        fontWeight: '600',
    },
    subTitleSpan: {
        fontWeight: '400',
        color: '#666',
    },
    columnWrapper: {
        justifyContent: 'space-between',
    },
    monthSection: {
        width: COLUMN_WIDTH,
        marginBottom: 30,
    },
    monthHeader: {
        marginBottom: 15,
    },
    monthTitle: {
        fontSize: 16,
        color: COLORS.primary,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    underline: {
        height: 4,
        width: '80%',
        backgroundColor: '#CFD9E8', // Light blue/gray for the progress bar look in screenshot
        borderRadius: 2,
    },
    holidayItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    dateCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 5,
    },
    dateDay: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        lineHeight: 16,
    },
    dateWeekday: {
        fontSize: 10,
        color: '#666',
        lineHeight: 12,
    },
    holidayName: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
        flex: 1,
    },
});

export default HolidayScreen;
