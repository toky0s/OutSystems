var SddOperator = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // Index.js
  var Index_exports = {};
  __export(Index_exports, {
    SddOperator: () => SddOperator
  });

  // AddModifyColumn.js
  function sddAddModifyColumn(sdd, columnName, method, options = {}) {
    const rowCount = Object.values(sdd.data)[0]?.length || 0;
    const getColData = (colKey) => {
      const index = parseInt(colKey.replace("col-", "")) - 1;
      const colName = Object.keys(sdd.definitions)[index];
      return sdd.data[colName];
    };
    const getColDataByColumnName = (colName) => sdd.data[colName];
    const getColName = (colKey) => {
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
          sdd.data[columnName] = sdd.data[columnName].map((val) => val === null ? options.value : val);
        } else if (options.method === "Replace 'null' with value from another column") {
          const replacementData = getColDataByColumnName(options.sourceColumn);
          sdd.data[columnName] = sdd.data[columnName].map((val, i) => val === null ? replacementData[i] : val);
        }
        break;
      case "Create column based off values in a different column via mapping":
        const baseData = getColDataByColumnName(options.baseColumn);
        const newCol = baseData.map((v) => {
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
          Divide: (a, b) => b !== 0 ? a / b : null
        };
        sdd.definitions[columnName] = { kind: "number", optional: false };
        sdd.data[columnName] = lhsStatic.map((v) => v == null ? null : opMap[options.operation](v, options.rhsValue));
        break;
      case "Add/subtract/divide/multiply by another column":
        const lhs = getColDataByColumnName(options.lhs);
        const rhs = getColDataByColumnName(options.rhs);
        const opMap2 = {
          Add: (a, b) => a + b,
          Subtract: (a, b) => a - b,
          Multiply: (a, b) => a * b,
          Divide: (a, b) => b !== 0 ? a / b : null
        };
        sdd.definitions[columnName] = { kind: "number", optional: false };
        sdd.data[columnName] = lhs.map((v, i) => {
          if (v == null || rhs[i] == null) return null;
          return opMap2[options.operation](v, rhs[i]);
        });
        break;
      case "Concatenate columns/strings":
        const concatResult = Array(rowCount).fill("").map((_, i) => {
          return options.values.map((piece) => {
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
            converted = original.map((v) => v != null ? String(v) : null);
            break;
          case "Number":
            converted = original.map((v) => {
              const n = Number(v);
              return isNaN(n) ? null : n;
            });
            break;
          case "Boolean":
            converted = original.map((v) => Boolean(v));
            break;
          case "Date":
            converted = original.map((v) => {
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

  // Merge.js
  function sddMerge(sdd1, sdd2, method) {
    const result = {
      definitions: {},
      data: {}
    };
    const getDefMap = (defs) => Object.entries(defs).reduce((acc, [name, def], index) => {
      acc[name] = { ...def, index };
      return acc;
    }, {});
    if (method === "Append") {
      if (JSON.stringify(sdd1.definitions) !== JSON.stringify(sdd2.definitions)) {
        throw new Error("Schemas do not match for Append.");
      }
      result.definitions = { ...sdd1.definitions };
      for (const name in result.definitions) {
        result.data[name] = [...sdd1.data[name] || [], ...sdd2.data[name] || []];
      }
    } else if (method === "Append (loose)") {
      const allKeys = Array.from(/* @__PURE__ */ new Set([
        ...Object.keys(sdd1.definitions),
        ...Object.keys(sdd2.definitions)
      ]));
      for (const name of allKeys) {
        result.definitions[name] = sdd1.definitions[name] || sdd2.definitions[name] || { kind: "any", optional: true };
        const len1 = sdd1.data[sdd1.data[name] ? name : Object.keys(sdd1.data)[0]].length;
        const len2 = sdd2.data[sdd2.data[name] ? name : Object.keys(sdd2.data)[0]].length;
        result.data[name] = [
          ...sdd1.data[name] || Array(len1).fill(null),
          ...sdd2.data[name] || Array(len2).fill(null)
        ];
      }
    } else if (method === "Left Join") {
      const keyField = Object.keys(sdd1.definitions)[0];
      const defMap1 = getDefMap(sdd1.definitions);
      const defMap2 = getDefMap(sdd2.definitions);
      const keyValues = sdd1.data[keyField];
      const rowCount = keyValues.length;
      const lookup = /* @__PURE__ */ new Map();
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

  // Aggregate.js
  function sddAggregate(sdd, grouping, aggregations) {
    const { data, definitions } = sdd;
    const cols = Object.keys(data);
    if (cols.length === 0) return { data: {}, definitions: {} };
    const rowCount = data[cols[0]].length;
    for (const col of cols) {
      if (data[col].length !== rowCount) {
        throw new Error(`Column '${col}' length mismatch`);
      }
    }
    for (const field of grouping) {
      if (!definitions[field]) {
        throw new Error(`Grouping field '${field}' not found`);
      }
    }
    const numeric = /* @__PURE__ */ new Set(["Sum", "Min", "Max", "Average", "Median"]);
    const anySet = /* @__PURE__ */ new Set(["Count", "Unique Count"]);
    const strSet = /* @__PURE__ */ new Set(["Concatenate"]);
    const genSet = /* @__PURE__ */ new Set(["First", "Last"]);
    for (const { InColumn, Method, WhatTodoWithANullVale } of aggregations) {
      if (!definitions[InColumn]) {
        throw new Error(`InColumn '${InColumn}' not found`);
      }
      const kind = definitions[InColumn].kind;
      if (numeric.has(Method) && kind !== "number") {
        throw new Error(`Method '${Method}' requires numeric field, got '${kind}'`);
      }
      if (strSet.has(Method) && kind !== "string") {
        throw new Error(`Method '${Method}' requires string field, got '${kind}'`);
      }
      if (![...numeric, ...anySet, ...strSet, ...genSet].includes(Method)) {
        throw new Error(`Unsupported Method '${Method}'`);
      }
    }
    const groupMap = /* @__PURE__ */ new Map();
    for (let i = 0; i < rowCount; i++) {
      const key = grouping.map((f) => data[f][i]).join("|\u25FC|");
      if (!groupMap.has(key)) groupMap.set(key, []);
      groupMap.get(key).push(i);
    }
    const outData = {};
    const outDefs = {};
    for (const g of grouping) {
      outData[g] = [];
      outDefs[g] = { ...definitions[g] };
    }
    for (const { InColumn } of aggregations) {
      outData[InColumn] = [];
      outDefs[InColumn] = { ...definitions[InColumn], optional: true };
    }
    for (const [key, idxs] of groupMap) {
      const vals = key.split("|\u25FC|");
      grouping.forEach((g, i) => outData[g].push(vals[i]));
      for (const { InColumn, Method, WhatTodoWithANullVale } of aggregations) {
        const items = idxs.map((i) => data[InColumn][i]);
        const hasNull = items.some((v) => v == null);
        let result;
        if (hasNull && WhatTodoWithANullVale === null) {
          result = null;
        } else {
          const clean = hasNull ? WhatTodoWithANullVale === null ? items.filter((v) => v != null) : items.map((v) => v == null ? WhatTodoWithANullVale : v) : items;
          switch (Method) {
            case "Sum":
              result = clean.reduce((a, b) => a + b, 0);
              break;
            case "Min":
              result = clean.length ? Math.min(...clean) : null;
              break;
            case "Max":
              result = clean.length ? Math.max(...clean) : null;
              break;
            case "Average":
              result = clean.length ? clean.reduce((a, b) => a + b, 0) / clean.length : null;
              break;
            case "Median":
              {
                const s = [...clean].sort((a, b) => a - b);
                const m = s.length;
                result = m === 0 ? null : m % 2 ? s[(m - 1) / 2] : (s[m / 2 - 1] + s[m / 2]) / 2;
              }
              break;
            case "Count":
              result = clean.filter((v) => v != null).length;
              break;
            case "Unique Count":
              result = new Set(clean.filter((v) => v != null)).size;
              break;
            case "Concatenate":
              result = clean.filter((v) => v != null).join("");
              break;
            case "First":
              result = items[0] !== void 0 ? items[0] : null;
              break;
            case "Last":
              result = items.length ? items[items.length - 1] : null;
              break;
            default:
              throw new Error(`Unsupported Method '${Method}'`);
          }
        }
        outData[InColumn].push(result);
      }
    }
    return { data: outData, definitions: outDefs, version: "" };
  }

  // Filter.js
  function sddFilter(sdd, columnName, filterType, value) {
    const { data, definitions } = sdd;
    if (!data[columnName]) {
      throw new Error(`Column '${columnName}' not found in data.`);
    }
    const supportedTypes = [
      "Value equals",
      "Value does not equal",
      "Value is in array",
      "Value is not in array",
      "Value is less than",
      "Value is less than (or equal)",
      "Value is greater than",
      "Value is greater than (or equal)"
    ];
    if (!supportedTypes.includes(filterType)) {
      throw new Error(`Unsupported filter type '${filterType}'.`);
    }
    const values = data[columnName];
    const matches = values.map((v) => {
      switch (filterType) {
        case "Value equals":
          return v === value;
        case "Value does not equal":
          return v !== value;
        case "Value is in array":
          if (!Array.isArray(value)) throw new Error(`Value must be an array for 'Value is in array'`);
          return value.includes(v);
        case "Value is not in array":
          if (!Array.isArray(value)) throw new Error(`Value must be an array for 'Value is not in array'`);
          return !value.includes(v);
        case "Value is less than":
          return v < value;
        case "Value is less than (or equal)":
          return v <= value;
        case "Value is greater than":
          return v > value;
        case "Value is greater than (or equal)":
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
      definitions: { ...definitions }
      // definitions không thay đổi
    };
  }

  // ColumnToArray.js
  function sddColumnToArray(sdd, column, isRemoveDuplicateValues) {
    if (column in sdd.data) {
      const col = sdd.data[column];
      return isRemoveDuplicateValues ? [...new Set(col)] : col;
    } else {
      throw new Error(`Column doest not exist in SDD: ${column}`);
    }
  }

  // Serialize.js
  function sddConvertSddToArrayAsync(sdd, batchSize = 1e3, onProgress = () => {
  }, onComplete) {
    const { definitions, data } = sdd;
    const length = Object.values(data)[0]?.length || 0;
    const result = [];
    let index = 0;
    function processBatch() {
      const end = Math.min(index + batchSize, length);
      for (; index < end; index++) {
        const row = {};
        for (const def in definitions) {
          row[def] = data[def][index];
        }
        result.push(row);
      }
      onProgress(result.length, length);
      if (index < length) {
        setTimeout(processBatch, 0);
      } else {
        onComplete(result);
      }
    }
    processBatch();
  }

  // OperateOnColumn.js
  function sddRenameColumn(sdd, origin, newName) {
    const { data, definitions } = sdd;
    if (!data.hasOwnProperty(origin)) {
      throw new Error(`Column '${origin}' not found`);
    }
    if (data.hasOwnProperty(newName)) {
      throw new Error(`Column '${newName}' already exists`);
    }
    const newData = { ...data };
    const newDefs = { ...definitions };
    newData[newName] = newData[origin];
    delete newData[origin];
    newDefs[newName] = newDefs[origin];
    delete newDefs[origin];
    return { data: newData, definitions: newDefs };
  }
  function sddDuplicateColumn(sdd, origin, newName) {
    const { data, definitions } = sdd;
    if (!data.hasOwnProperty(origin)) {
      throw new Error(`Column '${origin}' not found`);
    }
    if (data.hasOwnProperty(newName)) {
      throw new Error(`Column '${newName}' already exists`);
    }
    const newData = { ...data };
    const newDefs = { ...definitions };
    newData[newName] = [...newData[origin]];
    newDefs[newName] = { ...newDefs[origin] };
    return { data: newData, definitions: newDefs };
  }
  function sddDeleteColumn(sdd, column) {
    const { data, definitions } = sdd;
    if (!data.hasOwnProperty(column)) {
      throw new Error(`Column '${column}' not found`);
    }
    const newData = { ...data };
    const newDefs = { ...definitions };
    delete newData[column];
    delete newDefs[column];
    return { data: newData, definitions: newDefs };
  }
  function sddDeleteColumnsInArray(sdd, columns) {
    let { data, definitions } = sdd;
    const newData = { ...data };
    const newDefs = { ...definitions };
    for (const col of columns) {
      if (newData.hasOwnProperty(col)) {
        delete newData[col];
        delete newDefs[col];
      } else {
        throw new Error(`Column '${col}' not found`);
      }
    }
    return { data: newData, definitions: newDefs };
  }
  function sddDeleteColumnsNotInArray(sdd, keepColumns) {
    const { data, definitions } = sdd;
    const newData = {};
    const newDefs = {};
    for (const col of keepColumns) {
      if (!data.hasOwnProperty(col)) {
        throw new Error(`Column '${col}' not found`);
      }
      newData[col] = data[col];
      newDefs[col] = definitions[col];
    }
    return { data: newData, definitions: newDefs };
  }

  // Index.js
  var SddOperator = {
    sddMerge,
    sddAddModifyColumn,
    sddAggregate,
    sddFilter,
    sddColumnToArray,
    sddConvertSddToArrayAsync,
    sddDeleteColumn,
    sddDeleteColumnsInArray,
    sddDeleteColumnsNotInArray,
    sddDuplicateColumn,
    sddRenameColumn
  };
  return __toCommonJS(Index_exports);
})();
