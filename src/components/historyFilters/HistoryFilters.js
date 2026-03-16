import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateRangeFilter from './DateRangeFilter';
import LeaveTypeFilter from './LeaveTypeFilter';
import StatusFilter from './StatusFilter';
import { COLORS } from '../../utils/theme';

/**
 * Reusable filter bar for history screens.
 *
 * Props:
 *  - filters           : current filter state object from useHistoryFilters
 *  - onFilterChange     : (patch) => void — partial filter update
 *  - onResetFilters     : () => void
 *  - showDateFilter     : boolean  (default true)
 *  - showLeaveTypeFilter: boolean  (default true)
 *  - showStatusFilter   : boolean  (default false)
 *  - leaveTypes         : string[] (optional override)
 *  - statuses           : string[] (optional override)
 */
const HistoryFilters = ({
    filters,
    onFilterChange,
    onResetFilters,
    showDateFilter = true,
    showLeaveTypeFilter = true,
    showStatusFilter = false,
    leaveTypes,
    statuses,
    defaultFromDate = null,
    defaultToDate = null,
}) => {
    const hasAnyFilter =
        (filters.fromDate && filters.fromDate !== defaultFromDate) ||
        (filters.toDate && filters.toDate !== defaultToDate) ||
        filters.leaveTypes?.length > 0 ||
        filters.status?.length > 0;

    return (
        <View style={styles.container}>
            <View style={styles.filtersRow}>
                {showDateFilter && (
                    <DateRangeFilter
                        fromDate={filters.fromDate}
                        toDate={filters.toDate}
                        defaultFromDate={defaultFromDate}
                        defaultToDate={defaultToDate}
                        onChange={({ fromDate, toDate }) =>
                            onFilterChange({ fromDate, toDate })
                        }
                        onClear={() =>
                            onFilterChange({ fromDate: defaultFromDate, toDate: defaultToDate })
                        }
                    />
                )}

                {showLeaveTypeFilter && (
                    <LeaveTypeFilter
                        selected={filters.leaveTypes || []}
                        onChange={(types) =>
                            onFilterChange({ leaveTypes: types })
                        }
                        onClear={() => onFilterChange({ leaveTypes: [] })}
                        leaveTypes={leaveTypes}
                    />
                )}

                {showStatusFilter && (
                    <StatusFilter
                        selected={filters.status || []}
                        onChange={(statusArray) =>
                            onFilterChange({ status: statusArray })
                        }
                        onClear={() => onFilterChange({ status: [] })}
                        statuses={statuses}
                    />
                )}

                {hasAnyFilter && (
                    <TouchableOpacity
                        onPress={onResetFilters}
                        style={styles.resetBtn}
                        activeOpacity={0.7}
                    >
                        <Icon name="filter-remove" size={16} color={COLORS.red} />
                        <Text style={styles.resetText}>Clear</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#e5e7eb',
    },
    filtersRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        flexWrap: 'wrap',
        rowGap: 6,
    },
    resetBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.red || '#d32f2f',
    },
    resetText: {
        color: COLORS.red || '#d32f2f',
        fontSize: 11,
        fontWeight: '600',
        marginLeft: 4,
    },
});

export default HistoryFilters;
