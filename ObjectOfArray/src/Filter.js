/**
 * Filter SDD
 * 
 * @param {{ data: Record<string, any[]>, definitions: Record<string, { kind: string, optional: boolean }> }} sdd
 * @param {string} columnName - Column name need to be filter
 * @param {string} filterType - Filter enum
 * @param {any} value - Value to use for the filter
 * @returns {{ data: Record<string, any[]>, definitions: Record<string, { kind: string, optional: boolean }> }}
 */
export function sddFilter(sdd, columnName, filterType, value) {
    const { data, definitions } = sdd;

    if (!data[columnName]) {
        throw new Error(`Column '${columnName}' not found in data.`);
    }

    const supportedTypes = [
        'Value equals',
        'Value does not equal',
        'Value is in array',
        'Value is not in array',
        'Value is less than',
        'Value is less than (or equal)',
        'Value is greater than',
        'Value is greater than (or equal)'
    ];
    if (!supportedTypes.includes(filterType)) {
        throw new Error(`Unsupported filter type '${filterType}'.`);
    }

    const values = data[columnName];
    const matches = values.map(v => {
        switch (filterType) {
            case 'Value equals':
                return v === value;
            case 'Value does not equal':
                return v !== value;
            case 'Value is in array':
                if (!Array.isArray(value)) throw new Error(`Value must be an array for 'Value is in array'`);
                return value.includes(v);
            case 'Value is not in array':
                if (!Array.isArray(value)) throw new Error(`Value must be an array for 'Value is not in array'`);
                return !value.includes(v);
            case 'Value is less than':
                return v < value;
            case 'Value is less than (or equal)':
                return v <= value;
            case 'Value is greater than':
                return v > value;
            case 'Value is greater than (or equal)':
                return v >= value;
            default:
                return false;
        }
    });

    const filteredData = {};
    for (const col in data) {
        filteredData[col] = data[col].filter((_, i) => matches[i]);
    }

    return {
        data: filteredData,
        definitions: { ...definitions } // definitions không thay đổi
    };
}
