export const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(null, args);
        }, wait);
    };
};
