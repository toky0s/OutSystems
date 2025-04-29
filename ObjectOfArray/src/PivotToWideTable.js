/**
 * Pivot SDD to wide table.
 * 
 * @param {{ data: Record<string, any[]>, definitions: Record<string, { kind: string, optional: boolean }> }} sdd
 * @param {string} keepColumn - Column name to keep
 * @param {string} pivotColumn - Column to pivot on
 * @param {string} valueColumn - Column to use as values inside new cells
 * @param {string[]} [paddingColumns=[]] - Columns to copy as-is
 * @returns {{ data: Record<string, any[]>, definitions: Record<string, { kind: string, optional: boolean }> }}
 */
export function sddPivotToWideTable(sdd, keepColumn, pivotColumn, valueColumn, paddingColumns = []) {
    const { data, definitions } = sdd;
    const rowCount = Object.values(data)[0]?.length || 0;

    if (!data.hasOwnProperty(keepColumn)) throw new Error(`Keep column '${keepColumn}' not found`);
    if (!data.hasOwnProperty(pivotColumn)) throw new Error(`Pivot column '${pivotColumn}' not found`);
    if (!data.hasOwnProperty(valueColumn)) throw new Error(`Value column '${valueColumn}' not found`);

    const result = {
        data: {},
        definitions: {}
    };

    // Step 1: Collect unique pivot values
    const uniquePivotValues = Array.from(new Set(data[pivotColumn]));

    // Step 2: Group by keepColumn (optionally with padding columns)
    const groupKey = (i) => {
        const parts = [data[keepColumn][i]];
        for (const padCol of paddingColumns) {
            if (!data.hasOwnProperty(padCol)) throw new Error(`Padding column '${padCol}' not found`);
            parts.push(data[padCol][i]);
        }
        return parts.join('|◼|');
    };

    const groupMap = new Map();
    for (let i = 0; i < rowCount; i++) {
        const key = groupKey(i);
        if (!groupMap.has(key)) groupMap.set(key, {});
        groupMap.get(key)[data[pivotColumn][i]] = data[valueColumn][i];
    }

    // Step 3: Build result columns
    result.data[keepColumn] = [];
    result.definitions[keepColumn] = { ...definitions[keepColumn] };

    for (const padCol of paddingColumns) {
        result.data[padCol] = [];
        result.definitions[padCol] = { ...definitions[padCol] };
    }

    for (const pv of uniquePivotValues) {
        result.data[pv] = [];
        result.definitions[pv] = { kind: definitions[valueColumn].kind, optional: true };
    }

    // Step 4: Fill data
    for (const key of groupMap.keys()) {
        const [keepVal, ...padVals] = key.split('|◼|');
        result.data[keepColumn].push(keepVal);
        paddingColumns.forEach((padCol, idx) => {
            result.data[padCol].push(padVals[idx]);
        });

        const valueMap = groupMap.get(key);
        for (const pv of uniquePivotValues) {
            result.data[pv].push(pv in valueMap ? valueMap[pv] : null);
        }
    }

    return { data: result.data, definitions: result.definitions };
}

// Testcase: https://chatgpt.com/share/680f30b2-6dfc-8000-af7e-b3948850af44
// const sdd = {
//     definitions: {
//         ID: { kind: 'string', optional: false },
//         Subject: { kind: 'string', optional: false },
//         Score: { kind: 'number', optional: false }
//     },
//     data: {
//         ID: ['A', 'A', 'B', 'B'],
//         Subject: ['Math', 'Physics', 'Math', 'Physics'],
//         Score: [90, 85, 75, 80]
//     }
// };

// const pivoted = sddPivotToWideTable(
//     sdd,
//     'ID',          // keep column
//     'Subject',     // pivot on
//     'Score',       // value column
//     []             // no padding columns
// );

// console.log(JSON.stringify(pivoted, null, 2));

// const expectedResult = {
//     "definitions": {
//         "ID": { "kind": "string", "optional": false },
//         "Math": { "kind": "number", "optional": true },
//         "Physics": { "kind": "number", "optional": true }
//     },
//     "data": {
//         "ID": ["A", "B"],
//         "Math": [90, 75],
//         "Physics": [85, 80]
//     }
// }
