/**
 * Convert object-of-arrays to array-of-object.
 * 
 * @param {Object} sdd SDD
 * @param {Number} batchSize Batch size, default 1000
 * @param {Function} onProgress On Progress function
 * @param {Function} onComplete On Complete callback
 */
export function sddConvertSddToArrayAsync(sdd, batchSize = 1000, onProgress = () => { }, onComplete) {
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
