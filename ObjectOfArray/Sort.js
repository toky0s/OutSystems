/**
 * Try casting a value to number; throw if not possible
 */
function castToNumber(value, i) {
  const n = Number(value);
  if (isNaN(n)) throw new Error(`Row ${i}: Cannot cast '${value}' to number`);
  return n;
}

/** Try cast to string */
function castToString(value) {
  return value != null ? String(value) : '';
}

/**
 * Sort rows in SDD by a column.
 * @param {object} sdd - input SDD
 * @param {string} column - column name to sort by
 * @param {string} method - one of:
 *   'Alphabetically - ascending', 'Alphabetically - descending',
 *   'Numerically - ascending', 'Numerically - descending',
 *   'Explicit order'
 * @param {Array<string|number|boolean>} [explicitOrder] - required if method is 'Explicit order'
 * @returns {object} new SDD sorted accordingly
 */
function sortSDD(sdd, column, method, explicitOrder) {
  const { data, definitions } = sdd;
  if (!data.hasOwnProperty(column)) throw new Error(`Column '${column}' not found`);
  const rowCount = data[column].length;
  const indices = Array.from({ length: rowCount }, (_, i) => i);
  const values = data[column];

  let casted;
  switch (method) {
    case 'Alphabetically - ascending':
      casted = values.map(castToString);
      indices.sort((a, b) => casted[a].localeCompare(casted[b]));
      break;
    case 'Alphabetically - descending':
      casted = values.map(castToString);
      indices.sort((a, b) => casted[b].localeCompare(casted[a]));
      break;
    case 'Numerically - ascending':
      casted = values.map((v, i) => castToNumber(v, i));
      indices.sort((a, b) => casted[a] - casted[b]);
      break;
    case 'Numerically - descending':
      casted = values.map((v, i) => castToNumber(v, i));
      indices.sort((a, b) => casted[b] - casted[a]);
      break;
    case 'Explicit order':
      if (!Array.isArray(explicitOrder)) throw new Error(`Explicit order requires an array`);
      const orderMap = new Map();
      explicitOrder.forEach((v, i) => orderMap.set(v, i));
      for (let i = 0; i < rowCount; i++) {
        if (!orderMap.has(values[i])) throw new Error(`Value '${values[i]}' at row ${i} not in explicit order array`);
      }
      indices.sort((a, b) => orderMap.get(values[a]) - orderMap.get(values[b]));
      break;
    default:
      throw new Error(`Unsupported sorting method '${method}'`);
  }

  // reorder all columns
  const newData = {};
  for (const col in data) {
    newData[col] = indices.map(i => data[col][i]);
  }
  return { data: newData, definitions: { ...definitions } };
}
