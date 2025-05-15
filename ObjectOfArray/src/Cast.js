export function sddCast(array, type) {
    return array.map(val => {
        switch (type) {
            case "Number":
                if (typeof val === "boolean") {
                    return val ? 1 : 0;
                }
                const num = Number(val);
                return isNaN(num) ? null : num;

            case "String":
                if (val === null || val === undefined) return null;
                return String(val);

            case "Boolean":
                if (
                    val === null ||
                    val === undefined ||
                    val === false ||
                    val === 0 ||
                    val === "" ||
                    (typeof val === "object" && val !== null && Object.keys(val).length === 0)
                ) {
                    return false;
                }
                return true;

            default:
                throw new Error(`Unsupported type: ${type}`);
        }
    });
}
