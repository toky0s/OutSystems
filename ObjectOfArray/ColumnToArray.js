/**
 * Column to Array
 * 
 * @param {Object} sdd SDD
 * @param {String} column Column name
 * @param {isRemoveDuplicateValues} Whether remove duplicated values
 * @author XinTA - 2025/05/21
 */
function DaisColumnToArray(sdd, column, isRemoveDuplicateValues) {
    if (column in sdd.data) {
        const col = sdd.data[column]
        return isRemoveDuplicateValues ? [...new Set(col)] : col
    }
    else {
        throw new Error(`Column doest not exist in SDD: ${column}`);
    }
}