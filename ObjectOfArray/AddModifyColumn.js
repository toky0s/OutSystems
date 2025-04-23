function DaisAddModifyColumn(sdd, columnName, method, options = {}) {
    const rowCount = Object.values(sdd.data)[0]?.length || 0;

    const getColData = colKey => {
        const index = parseInt(colKey.replace("col-", "")) - 1;
        const colName = Object.keys(sdd.definitions)[index];
        return sdd.data[colName];
    };

    const getColDataByColumnName = colName => sdd.data[colName];
    const getColName = colKey => {
        const index = parseInt(colKey.replace("col-", "")) - 1;
        return Object.keys(sdd.definitions)[index];
    };

    const ensureColumnExists = () => {
        if (!(columnName in sdd.definitions)) {
            sdd.definitions[columnName] = { kind: "any", optional: false };
            sdd.data[columnName] = Array(rowCount).fill(null);
        }
    };

    switch (method) {
        case "Add column with static value":
            sdd.definitions[columnName] = { kind: options.columnType?.toLowerCase() || "any", optional: false };
            sdd.data[columnName] = Array(rowCount).fill(options.value);
            break;

        case "Replace 'null' cells with value":
            ensureColumnExists();
            if (options.method === "Replace 'null' with static value") {
                sdd.data[columnName] = sdd.data[columnName].map(val => val === null ? options.value : val);
            } else if (options.method === "Replace 'null' with value from another column") {
                const replacementData = getColDataByColumnName(options.sourceColumn);
                sdd.data[columnName] = sdd.data[columnName].map((val, i) => val === null ? replacementData[i] : val);
            }
            break;

        case "Create column based off values in a different column via mapping":
            const baseData = getColDataByColumnName(options.baseColumn);
            const newCol = baseData.map(v => {
                if (options.mapping.hasOwnProperty(v)) return options.mapping[v];
                if (options.fallback === "Replace with static value") return options.fallbackValue;
                return v;
            });
            sdd.definitions[columnName] = { kind: "any", optional: false };
            sdd.data[columnName] = newCol;
            break;

        case "Add/subtract/divide/multiply by static value":
            const lhsStatic = getColDataByColumnName(options.lhs);
            const opMap = {
                Add: (a, b) => a + b,
                Subtract: (a, b) => a - b,
                Multiply: (a, b) => a * b,
                Divide: (a, b) => b !== 0 ? a / b : null,
            };
            sdd.definitions[columnName] = { kind: "number", optional: false };
            sdd.data[columnName] = lhsStatic.map(v => (v == null ? null : opMap[options.operation](v, options.rhsValue)));
            break;

        case "Add/subtract/divide/multiply by another column":
            const lhs = getColDataByColumnName(options.lhs);
            const rhs = getColDataByColumnName(options.rhs);
            const opMap2 = {
                Add: (a, b) => a + b,
                Subtract: (a, b) => a - b,
                Multiply: (a, b) => a * b,
                Divide: (a, b) => b !== 0 ? a / b : null,
            };
            sdd.definitions[columnName] = { kind: "number", optional: false };
            sdd.data[columnName] = lhs.map((v, i) => {
                if (v == null || rhs[i] == null) return null;
                return opMap2[options.operation](v, rhs[i]);
            });
            break;

        case "Concatenate columns/strings":
            const concatResult = Array(rowCount).fill("").map((_, i) => {
                return options.values.map(piece => {
                    if (typeof piece === "string" && piece.startsWith("$.col-")) {
                        const colName = getColName(piece.slice(2));
                        return sdd.data[colName]?.[i] ?? "";
                    } else {
                        return piece;
                    }
                }).join("");
            });
            sdd.definitions[columnName] = { kind: "string", optional: false };
            sdd.data[columnName] = concatResult;
            break;

        case "Add column containing the index each row":
            sdd.definitions[columnName] = { kind: "number", optional: false };
            sdd.data[columnName] = Array.from({ length: rowCount }, (_, i) => i);
            break;

        case "Convert column type":
            if (!(columnName in sdd.definitions)) {
                if (options.behavior === "Do nothing") return sdd;
                else if (options.behavior === "Create empty column") {
                    sdd.definitions[columnName] = { kind: options.columnType.toLowerCase(), optional: false };
                    sdd.data[columnName] = Array(rowCount).fill(null);
                    return sdd;
                }
            }

            const original = sdd.data[columnName];
            let converted;

            switch (options.columnType) {
                case "String":
                    converted = original.map(v => v != null ? String(v) : null);
                    break;
                case "Number":
                    converted = original.map(v => {
                        const n = Number(v);
                        return isNaN(n) ? null : n;
                    });
                    break;
                case "Boolean":
                    converted = original.map(v => Boolean(v));
                    break;
                case "Date":
                    converted = original.map(v => {
                        if (typeof v === "number") {
                            const d = new Date(v);
                            return isNaN(d) ? null : d.toISOString().slice(0, 10);
                        }
                        return null;
                    });
                    break;
            }

            sdd.definitions[columnName].kind = options.columnType.toLowerCase();
            sdd.data[columnName] = converted;
            break;

        default:
            throw new Error(`Unsupported method: ${method}`);
    }

    return sdd;
}
