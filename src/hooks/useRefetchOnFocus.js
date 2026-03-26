import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';

/**
 * Global useRefetchOnFocus hook.
 *
 * Ensures `fetchFn` is called every time the screen comes into focus.
 * Use this instead of useEffect([]) to guarantee fresh data on every navigation.
 *
 * @param {Function} fetchFn - The fetch/refetch function to call on focus
 * @param {Array} deps - Additional dependencies (default: [])
 *
 * @example
 * useRefetchOnFocus(fetchData);
 * useRefetchOnFocus(fetchData, [filters, activeTab]);
 */
const useRefetchOnFocus = (fetchFn, deps = []) => {
    useFocusEffect(
        useCallback(() => {
            fetchFn();
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [fetchFn, ...deps])
    );
};

export default useRefetchOnFocus;
