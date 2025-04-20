/**
 * Aggregate SDD table data.
 *
 * @param {{ data: Record<string, any[]>, definitions: Record<string, { kind: string, optional: boolean }> }} sdd
 * @param {string[]} grouping - list of column names to group by
 * @param {{ InColumn: string, Method: string, WhatTodoWithANullVale: any }[]} aggregations
 * @returns {{ data: Record<string, any[]>, definitions: Record<string, { kind: string, optional: boolean }> }} aggregated SDD
 *
 * Supported Methods:
 *   - Sum, Min, Max, First, Last, Average, Median, Count, Unique Count, Concatenate
 *
 * WhatTodoWithANullVale:
 *   - A replacement value for null entries. If set to `null`, any null in the group => result is null.
 *
 * Throws error if:
 *   1. A grouping field is not in definitions
 *   2. An InColumn is not in definitions
 *   3. A Method is incompatible with field kind
 */
function aggregateSDD(sdd, grouping, aggregations) {
    const { data, definitions } = sdd;
    const cols = Object.keys(data);
    if (cols.length === 0) return { data: {}, definitions: {} };
    const rowCount = data[cols[0]].length;
    for (const col of cols) {
        if (data[col].length !== rowCount) {
            throw new Error(`Column '${col}' length mismatch`);
        }
    }

    // Validate grouping fields
    for (const field of grouping) {
        if (!definitions[field]) {
            throw new Error(`Grouping field '${field}' not found`);
        }
    }

    // Supported method sets
    const numeric = new Set(['Sum', 'Min', 'Max', 'Average', 'Median']);
    const anySet = new Set(['Count', 'Unique Count']);
    const strSet = new Set(['Concatenate']);
    const genSet = new Set(['First', 'Last']);

    // Validate aggregations
    for (const { InColumn, Method, WhatTodoWithANullVale } of aggregations) {
        if (!definitions[InColumn]) {
            throw new Error(`InColumn '${InColumn}' not found`);
        }
        const kind = definitions[InColumn].kind;
        if (numeric.has(Method) && kind !== 'number') {
            throw new Error(`Method '${Method}' requires numeric field, got '${kind}'`);
        }
        if (strSet.has(Method) && kind !== 'string') {
            throw new Error(`Method '${Method}' requires string field, got '${kind}'`);
        }
        if (![...numeric, ...anySet, ...strSet, ...genSet].includes(Method)) {
            throw new Error(`Unsupported Method '${Method}'`);
        }
    }

    // Group rows
    const groupMap = new Map();
    for (let i = 0; i < rowCount; i++) {
        const key = grouping.map(f => data[f][i]).join('|◼|');
        if (!groupMap.has(key)) groupMap.set(key, []);
        groupMap.get(key).push(i);
    }

    // Prepare output SDD
    const outData = {};
    const outDefs = {};
    // Add grouping cols first
    for (const g of grouping) {
        outData[g] = [];
        outDefs[g] = { ...definitions[g] };
    }
    // Add aggregated cols (same name as InColumn)
    for (const { InColumn } of aggregations) {
        outData[InColumn] = [];
        outDefs[InColumn] = { ...definitions[InColumn], optional: true };
    }

    // Compute each group
    for (const [key, idxs] of groupMap) {
        const vals = key.split('|◼|');
        grouping.forEach((g, i) => outData[g].push(vals[i]));

        for (const { InColumn, Method, WhatTodoWithANullVale } of aggregations) {
            const items = idxs.map(i => data[InColumn][i]);
            const hasNull = items.some(v => v == null);
            let result;
            if (hasNull && WhatTodoWithANullVale === null) {
                result = null;
            } else {
                const clean = hasNull
                    ? (WhatTodoWithANullVale === null
                        ? items.filter(v => v != null)
                        : items.map(v => v == null ? WhatTodoWithANullVale : v))
                    : items;

                switch (Method) {
                    case 'Sum': result = clean.reduce((a, b) => a + b, 0); break;
                    case 'Min': result = clean.length ? Math.min(...clean) : null; break;
                    case 'Max': result = clean.length ? Math.max(...clean) : null; break;
                    case 'Average': result = clean.length ? clean.reduce((a, b) => a + b, 0) / clean.length : null; break;
                    case 'Median': {
                        const s = [...clean].sort((a, b) => a - b);
                        const m = s.length;
                        result = m === 0 ? null : (m % 2 ? s[(m - 1) / 2] : (s[m / 2 - 1] + s[m / 2]) / 2);
                    } break;
                    case 'Count': result = clean.filter(v => v != null).length; break;
                    case 'Unique Count': result = new Set(clean.filter(v => v != null)).size; break;
                    case 'Concatenate': result = clean.filter(v => v != null).join(''); break;
                    case 'First': result = items[0] !== undefined ? items[0] : null; break;
                    case 'Last': result = items.length ? items[items.length - 1] : null; break;
                    default: throw new Error(`Unsupported Method '${Method}'`);
                }
            }
            outData[InColumn].push(result);
        }
    }

    return { data: outData, definitions: outDefs, version: ""};
}
