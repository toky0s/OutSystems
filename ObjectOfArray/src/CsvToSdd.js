/**
 * Create empty SDD object
 */
function createEmptySdd() {
    return {
        data: {},
        definitions: {},
        sddFormat: 'sdd/table/object-of-arrays',
        version: '1.0.0'
    };
}

/**
 * Generate definition for a column
 * @param {string} columnName 
 * @param {string} type - One of: String, Number, Integer, Boolean, Enum, Time, Currency
 * @returns {{ kind: string, optional: boolean }}
 */
function generateDefinition(columnName, type) {
    const validTypes = ['string', 'number', 'integer', 'boolean', 'enum', 'time', 'currency'];
    const kind = type.toLowerCase();
    if (!validTypes.includes(kind)) {
        throw new Error(`Unsupported type '${type}' for column '${columnName}'`);
    }
    return {
        kind: kind,
        optional: false
    };
}

/**
 * Convert CSV text to SDD
 * @param {string} csvText - CSV content
 * @param {string} defaultType - Default type applied for columns if no override
 * @param {{Column: string, Type: string}[]} columnTypeOverrides - Specific column type overrides
 * @returns {object} SDD object
 */
export function csvToSdd(csvText, defaultType, columnTypeOverrides = []) {
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length === 0) {
        throw new Error('CSV is empty.');
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const sdd = createEmptySdd();

    // Prepare type map
    const typeOverrideMap = {};
    for (const { Column, Type } of columnTypeOverrides) {
        typeOverrideMap[Column] = Type;
    }

    for (const header of headers) {
        const appliedType = typeOverrideMap[header] || defaultType;
        sdd.definitions[header] = generateDefinition(header, appliedType);
        sdd.data[header] = [];
    }

    // Fill data
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '') continue; // skip empty lines
        const cells = lines[i].split(',').map(c => c.trim());
        for (let j = 0; j < headers.length; j++) {
            const header = headers[j];
            const value = parseValue(cells[j], sdd.definitions[header].kind);
            sdd.data[header].push(value);
        }
    }

    return sdd;
}

/**
 * Parse value based on kind
 * @param {string} rawValue 
 * @param {string} kind 
 * @returns {any}
 */
function parseValue(rawValue, kind) {
    if (rawValue === '' || rawValue.toLowerCase() === 'null') return null;

    switch (kind) {
        case 'string':
        case 'enum':
        case 'time':
        case 'currency':
            return rawValue;
        case 'number':
            const num = Number(rawValue);
            return isNaN(num) ? null : num;
        case 'integer':
            const int = parseInt(rawValue, 10);
            return isNaN(int) ? null : int;
        case 'boolean':
            return rawValue.toLowerCase() === 'true';
        default:
            return rawValue;
    }
}

// Test:
// CSV
// Name, Age, IsStudent
// Alice, 23, true
// Bob, 30, false
// Charlie, 22, true

// Script
// const sdd = csvToSdd(csvString, 'String', [
//     { Column: 'Age', Type: 'Number' },
//     { Column: 'IsStudent', Type: 'Boolean' }
// ]);
// console.log(JSON.stringify(sdd, null, 2));

// const output = {
//     "data": {
//         "Name": ["Alice", "Bob", "Charlie"],
//         "Age": [23, 30, 22],
//         "IsStudent": [true, false, true]
//     },
//     "definitions": {
//         "Name": { "kind": "string", "optional": false },
//         "Age": { "kind": "number", "optional": false },
//         "IsStudent": { "kind": "boolean", "optional": false }
//     },
//     "sddFormat": "sdd/table/object-of-arrays",
//     "version": "1.0.0"
// }
