/**
 * Column operations on SDD-formatted data.
 * Each function returns a new SDD object; original is not mutated.
 * SDD shape: { data: Record<string, any[]>, definitions: Record<string, { kind: string, optional: boolean }> }
 */

/**
 * Rename a column in SDD.
 * @param {object} sdd - input SDD
 * @param {string} origin - existing column name
 * @param {string} newName - new column name
 * @returns {object} new SDD with renamed column
 */
export function sddRenameColumn(sdd, origin, newName) {
    const { data, definitions } = sdd;
    if (!data.hasOwnProperty(origin)) {
        throw new Error(`Column '${origin}' not found`);
    }
    if (data.hasOwnProperty(newName)) {
        throw new Error(`Column '${newName}' already exists`);
    }
    // clone
    const newData = { ...data };
    const newDefs = { ...definitions };
    // rename in data
    newData[newName] = newData[origin];
    delete newData[origin];
    // rename in definitions
    newDefs[newName] = newDefs[origin];
    delete newDefs[origin];
    return { data: newData, definitions: newDefs };
}

/**
 * Duplicate a column in SDD under a new name.
 * @param {object} sdd - input SDD
 * @param {string} origin - existing column name
 * @param {string} newName - name for duplicated column
 * @returns {object} new SDD with duplicated column
 */
export function sddDuplicateColumn(sdd, origin, newName) {
    const { data, definitions } = sdd;
    if (!data.hasOwnProperty(origin)) {
        throw new Error(`Column '${origin}' not found`);
    }
    if (data.hasOwnProperty(newName)) {
        throw new Error(`Column '${newName}' already exists`);
    }
    // clone
    const newData = { ...data };
    const newDefs = { ...definitions };
    // duplicate
    newData[newName] = [...newData[origin]];
    newDefs[newName] = { ...newDefs[origin] };
    return { data: newData, definitions: newDefs };
}

/**
 * Delete a single column from SDD.
 * @param {object} sdd - input SDD
 * @param {string} column - column name to delete
 * @returns {object} new SDD without the specified column
 */
export function sddDeleteColumn(sdd, column) {
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

/**
 * Delete multiple columns specified in an array.
 * @param {object} sdd - input SDD
 * @param {string[]} columns - list of column names to delete
 * @returns {object} new SDD without those columns
 */
export function sddDeleteColumnsInArray(sdd, columns) {
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

/**
 * Delete all columns not listed in the array (keep only listed columns).
 * @param {object} sdd - input SDD
 * @param {string[]} keepColumns - list of column names to keep
 * @returns {object} new SDD containing only keepColumns
 */
export function sddDeleteColumnsNotInArray(sdd, keepColumns) {
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
