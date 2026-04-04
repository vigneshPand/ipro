/**
 * Converts the flat regularizationRecords array into display pairs.
 * currStatus: true = IN, false = OUT
 * Groups them in order: collects consecutive IN/OUT pairs.
 */
export const buildEntryRows = (records = []) => {
    if (!records || records.length === 0) return [];
    const rows = [];
    let i = 0;
    while (i < records.length) {
        const curr = records[i];
        if (curr.currStatus === true) {
            const next = records[i + 1];
            const isNextOut = next && next.currStatus === false;
            rows.push({
                inEntry: curr,
                outEntry: isNextOut ? next : null,
            });
            i += isNextOut ? 2 : 1;
        } else {
            // orphan OUT
            rows.push({ inEntry: null, outEntry: curr });
            i++;
        }
    }
    return rows;
};
