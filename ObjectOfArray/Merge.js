function DaisMerge(sdd1, sdd2, method) {
    const result = {
        definitions: {},
        data: {}
    };

    const getDefMap = defs => Object.entries(defs).reduce((acc, [name, def], index) => {
        acc[name] = { ...def, index };
        return acc;
    }, {});

    if (method === "Append") {
        if (JSON.stringify(sdd1.definitions) !== JSON.stringify(sdd2.definitions)) {
            throw new Error("Schemas do not match for Append.");
        }

        result.definitions = { ...sdd1.definitions };
        for (const name in result.definitions) {
            result.data[name] = [...(sdd1.data[name] || []), ...(sdd2.data[name] || [])];
        }

    } else if (method === "Append (loose)") {
        const allKeys = Array.from(new Set([
            ...Object.keys(sdd1.definitions),
            ...Object.keys(sdd2.definitions)
        ]));

        for (const name of allKeys) {
            result.definitions[name] = sdd1.definitions[name] || sdd2.definitions[name] || { kind: "any", optional: true };
            const len1 = sdd1.data[sdd1.data[name] ? name : Object.keys(sdd1.data)[0]].length;
            const len2 = sdd2.data[sdd2.data[name] ? name : Object.keys(sdd2.data)[0]].length;
            result.data[name] = [
                ...(sdd1.data[name] || Array(len1).fill(null)),
                ...(sdd2.data[name] || Array(len2).fill(null))
            ];
        }

    } else if (method === "Left Join") {
        const keyField = Object.keys(sdd1.definitions)[0];
        const defMap1 = getDefMap(sdd1.definitions);
        const defMap2 = getDefMap(sdd2.definitions);

        const keyValues = sdd1.data[keyField];
        const rowCount = keyValues.length;

        const lookup = new Map();
        for (let i = 0; i < sdd2.data[keyField].length; i++) {
            const key = sdd2.data[keyField][i];
            const row = {};
            for (const name in sdd2.data) {
                row[name] = sdd2.data[name][i];
            }
            lookup.set(key, row);
        }

        for (const name in sdd1.definitions) {
            result.definitions[name] = { ...sdd1.definitions[name] };
        }
        for (const name in sdd2.definitions) {
            if (name !== keyField) {
                result.definitions[name] = { ...sdd2.definitions[name] };
            }
        }

        for (const name in result.definitions) {
            result.data[name] = [];
        }

        for (let i = 0; i < rowCount; i++) {
            const key = sdd1.data[keyField][i];
            for (const name in sdd1.data) {
                result.data[name].push(sdd1.data[name][i]);
            }
            for (const name in sdd2.definitions) {
                if (name === keyField) continue;
                const val = lookup.get(key)?.[name] ?? null;
                result.data[name].push(val);
            }
        }

    } else {
        throw new Error("Invalid method");
    }

    return result;
}
