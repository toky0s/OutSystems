/**
 * Aggregate SDD table data.
 * @param {{ data: Record<string, any[]>, definitions: Record<string, { kind: string, optional: boolean }> }} sdd
 * @param {string[]} grouping list of column names to group by
 * @param {{ InColumn: string, Method: string, WhatTodoWithANullVale: any }[]} aggregations
 * @returns {{ data: Record<string, any[]>, definitions: Record<string, { kind: string, optional: boolean }> }} aggregated SDD
 * Supported Methods: Sum, Min, Max, First, Last, Average, Median, Count, Unique Count, Concatenate
 */
export function sddAggregate(sdd, grouping, aggregations) {
    const { data, definitions } = sdd;

    // Validate grouping columns
    grouping.forEach((col) => {
        if (!(col in data)) {
            throw new Error(`Grouping column "${col}" not found in data.`);
        }
    });

    // Preprocess: Prepare definitions for any missing aggregation columns
    aggregations.forEach(({ InColumn }) => {
        if (!(InColumn in data)) {
            // Treat as column of all nulls
            data[InColumn] = new Array(data[grouping[0]].length).fill(null);
            definitions[InColumn] = { kind: 'number', optional: true }; // Default to number kind
        }
    });

    // Validate aggregation method compatibility
    aggregations.forEach(({ InColumn, Method }) => {
        const kind = definitions[InColumn]?.kind;
        const numericMethods = ["Sum", "Min", "Max", "Average", "Median"];
        const stringMethods = ["Concatenate"];
        const countMethods = ["Count", "Unique Count", "First", "Last"];

        if (numericMethods.includes(Method) && kind !== "number") {
            throw new Error(`Method "${Method}" is not compatible with kind "${kind}" for column "${InColumn}"`);
        }
        if (stringMethods.includes(Method) && kind !== "string") {
            throw new Error(`Method "${Method}" is not compatible with kind "${kind}" for column "${InColumn}"`);
        }
        // Count and First/Last can work with anything
    });

    // Grouping
    const groupMap = new Map();
    const rowCount = data[grouping[0]].length;

    for (let i = 0; i < rowCount; i++) {
        const groupKey = grouping.map((col) => data[col][i]).join("|");
        if (!groupMap.has(groupKey)) groupMap.set(groupKey, []);
        groupMap.get(groupKey).push(i);
    }

    // Prepare result
    const resultData = {};
    const resultDefinitions = {};

    grouping.forEach((col) => {
        resultData[col] = [];
        resultDefinitions[col] = { ...definitions[col] };
    });

    aggregations.forEach(({ InColumn }) => {
        resultData[InColumn] = [];
        resultDefinitions[InColumn] = { ...definitions[InColumn] };
    });

    for (const [groupKey, indices] of groupMap.entries()) {
        const groupValues = groupKey.split("|");

        grouping.forEach((col, idx) => {
            const kind = definitions[col]?.kind;
            const raw = groupValues[idx];
            let casted;

            if (kind === "number") {
                casted = Number(raw);
            } else if (kind === "boolean") {
                casted = raw === "true";
            } else {
                casted = raw;
            }

            resultData[col].push(casted);
        });

        aggregations.forEach(({ InColumn, Method, WhatTodoWithANullVale }) => {
            const values = indices.map((i) => data[InColumn][i]);

            const hasNull = values.includes(null);
            let filteredValues;
            if (hasNull && WhatTodoWithANullVale === null) {
                resultData[InColumn].push(null);
                return;
            } else {
                filteredValues = values.map((v) => v === null ? WhatTodoWithANullVale : v);
            }

            const kind = definitions[InColumn].kind;
            let result = null;

            switch (Method) {
                case "Sum":
                    result = filteredValues.reduce((a, b) => a + b, 0);
                    break;
                case "Min":
                    result = Math.min(...filteredValues);
                    break;
                case "Max":
                    result = Math.max(...filteredValues);
                    break;
                case "Average":
                    result = filteredValues.reduce((a, b) => a + b, 0) / filteredValues.length;
                    break;
                case "Median": {
                    const sorted = [...filteredValues].sort((a, b) => a - b);
                    const mid = Math.floor(sorted.length / 2);
                    result = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
                    break;
                }
                case "Count":
                    result = values.filter((v) => v !== null).length;
                    break;
                case "Unique Count":
                    result = new Set(values.filter((v) => v !== null)).size;
                    break;
                case "First":
                    result = values.find((v) => v !== null);
                    break;
                case "Last":
                    result = [...values].reverse().find((v) => v !== null);
                    break;
                case "Concatenate":
                    result = values.filter((v) => v !== null).join(", ");
                    break;
                default:
                    throw new Error(`Unsupported aggregation method: ${Method}`);
            }

            resultData[InColumn].push(result);
        });
    }

    return {
        data: resultData,
        definitions: resultDefinitions,
    };
}
