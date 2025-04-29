/**
 * Merge two SDD (Structured Data Definition) datasets using the specified method.
 * @param {Object} sdd1 - The primary dataset (left table).
 * @param {Object} sdd2 - The secondary dataset (right table).
 * @param {string} method - "Append", "Append (loose)", or "Left Join".
 * @param {string|null} joinOn - Only used for "Left Join", format: "col-<index>", e.g., "col-2".
 * @returns {Object} - The merged SDD.
 */
export function sddMerge(sdd1, sdd2, method, joinOn = null) {
    const result = {
        definitions: {},
        data: {}
    };

    // Build a quick lookup of field metadata
    const getDefMap = defs => Object.entries(defs).reduce((acc, [name, def], index) => {
        acc[name] = { ...def, index };
        return acc;
    }, {});

    if (method === "Append") {
        // Strict append — both definitions must match exactly
        if (JSON.stringify(sdd1.definitions) !== JSON.stringify(sdd2.definitions)) {
            throw new Error("Schemas do not match for Append.");
        }

        result.definitions = { ...sdd1.definitions };
        for (const name in result.definitions) {
            result.data[name] = [...(sdd1.data[name] || []), ...(sdd2.data[name] || [])];
        }

    } else if (method === "Append (loose)") {
        // Loose append — union of fields, fill nulls where missing
        const allKeys = Array.from(new Set([
            ...Object.keys(sdd1.definitions),
            ...Object.keys(sdd2.definitions)
        ]));

        for (const name of allKeys) {
            result.definitions[name] = sdd1.definitions[name] || sdd2.definitions[name] || { kind: "any", optional: true };

            const len1 = sdd1.data[Object.keys(sdd1.data)[0]].length;
            const len2 = sdd2.data[Object.keys(sdd2.data)[0]].length;

            result.data[name] = [
                ...(sdd1.data[name] || Array(len1).fill(null)),
                ...(sdd2.data[name] || Array(len2).fill(null))
            ];
        }

    } else if (method === "Left Join") {
        const defKeys = Object.keys(sdd1.definitions);

        if (!joinOn || !/^col-\d+$/.test(joinOn)) {
            throw new Error("Invalid or missing 'joinOn' parameter for Left Join.");
        }

        const colIndex = parseInt(joinOn.split("-")[1], 10) - 1;
        if (colIndex < 0 || colIndex >= defKeys.length) {
            throw new Error(`Column index out of range for 'joinOn': ${joinOn}`);
        }

        const keyField = defKeys[colIndex]; // e.g. "date"

        // Create lookup map from sdd2
        const lookup = new Map();
        const sdd2Keys = sdd2.data[keyField] || [];

        for (let i = 0; i < sdd2Keys.length; i++) {
            const key = sdd2Keys[i];
            const row = {};
            for (const name in sdd2.data) {
                row[name] = sdd2.data[name][i];
            }
            lookup.set(key, row);
        }

        // Merge definitions
        result.definitions = { ...sdd1.definitions };
        for (const name in sdd2.definitions) {
            if (!(name in result.definitions)) {
                result.definitions[name] = sdd2.definitions[name];
            }
        }

        // Init result data arrays
        for (const name in result.definitions) {
            result.data[name] = [];
        }

        // Loop through sdd1 and merge with sdd2 if key matches
        const rowCount = sdd1.data[keyField].length;
        for (let i = 0; i < rowCount; i++) {
            const key = sdd1.data[keyField][i];
            const row2 = lookup.get(key) || {};

            for (const name in result.definitions) {
                if (sdd1.data[name]) {
                    result.data[name].push(sdd1.data[name][i]);
                } else {
                    // From sdd2 or fill with null
                    result.data[name].push(name in row2 ? row2[name] : null);
                }
            }
        }
    }
    else {
        throw new Error("Invalid method");
    }

    return result;
}
