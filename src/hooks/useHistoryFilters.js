import { useState, useCallback, useRef } from 'react';

const useHistoryFilters = (options = {}) => {
    const {
        sortBy = 'startDate',
        direction = 'asc',
        defaultFromDate = null,
        defaultToDate = null,
        defaultLeaveTypes = [],
        defaultStatuses = [],
    } = options;

    const [filters, setFilters] = useState({
        fromDate: defaultFromDate,
        toDate: defaultToDate,
        leaveTypes: defaultLeaveTypes,
        status: defaultStatuses,
        pageNo: 0,
    });

    // Keep a ref so callbacks always see latest filters without needing them in deps
    const filtersRef = useRef(filters);
    filtersRef.current = filters;

    /** Build the query-param object the API expects */
    const buildQueryParams = useCallback(
        (userId, year, keyword = '') => {
            const f = filtersRef.current;
            const params = {
                userId,
                year,
                pageNo: f.pageNo,
                sortBy,
                direction,
                keyword,
            };

            if (f.fromDate) params.fromDate = f.fromDate;
            if (f.toDate) params.toDate = f.toDate;
            if (f.leaveTypes.length > 0) params.leaveTypes = f.leaveTypes.join(',');
            if (f.status.length > 0) params.status = f.status.join(',');

            return params;
        },
        [sortBy, direction],
    );

    /** Partial update — merges into existing filters and resets pageNo */
    const updateFilters = useCallback((patch) => {
        setFilters((prev) => ({
            ...prev,
            ...patch,
            pageNo: 0, // always reset page when a filter changes
        }));
    }, []);

    /** Clear all filters back to defaults */
    const resetFilters = useCallback(() => {
        setFilters({
            fromDate: defaultFromDate,
            toDate: defaultToDate,
            leaveTypes: defaultLeaveTypes,
            status: defaultStatuses,
            pageNo: 0,
        });
    }, [defaultFromDate, defaultToDate, defaultLeaveTypes, defaultStatuses]);

    /** Advance page number (for pagination) */
    const nextPage = useCallback(() => {
        setFilters((prev) => ({ ...prev, pageNo: prev.pageNo + 1 }));
    }, []);

    return {
        filters,
        setFilters,
        updateFilters,
        resetFilters,
        buildQueryParams,
        nextPage,
    };
};

export default useHistoryFilters;
