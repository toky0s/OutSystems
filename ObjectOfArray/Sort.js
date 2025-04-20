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
  const kind = definitions[column].kind;
  const rowCount = data[column].length;
  const indices = Array.from({ length: rowCount }, (_, i) => i);

  switch (method) {
    case 'Alphabetically - ascending':
      if (kind !== 'string') throw new Error(`Alphabetical sort requires 'string' kind`);
      indices.sort((a, b) => String(data[column][a]).localeCompare(String(data[column][b])));
      break;
    case 'Alphabetically - descending':
      if (kind !== 'string') throw new Error(`Alphabetical sort requires 'string' kind`);
      indices.sort((a, b) => String(data[column][b]).localeCompare(String(data[column][a])));
      break;
    case 'Numerically - ascending':
      if (kind !== 'number') throw new Error(`Numeric sort requires 'number' kind`);
      indices.sort((a, b) => data[column][a] - data[column][b]);
      break;
    case 'Numerically - descending':
      if (kind !== 'number') throw new Error(`Numeric sort requires 'number' kind`);
      indices.sort((a, b) => data[column][b] - data[column][a]);
      break;
    case 'Explicit order':
      if (!Array.isArray(explicitOrder)) throw new Error(`Explicit order requires an array`);
      const orderMap = new Map();
      explicitOrder.forEach((v, i) => orderMap.set(v, i));
      // ensure all values present
      data[column].forEach(v => {
        if (!orderMap.has(v)) throw new Error(`Value '${v}' not in explicit order array`);
      });
      indices.sort((a, b) => orderMap.get(data[column][a]) - orderMap.get(data[column][b]));
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
