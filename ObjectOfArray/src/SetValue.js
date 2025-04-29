export function sddSetValue(object, keyPath, valueToSet, enable = true, createMissing = false) {
    if (!enable) return object;

    if (typeof keyPath !== 'string') {
        throw new Error("Key path must be a string");
    }

    const newObj = structuredClone(object);
    const pathParts = keyPath.split('.');

    let current = newObj;

    for (let i = 0; i < pathParts.length; i++) {
        const part = pathParts[i];
        const isLast = i === pathParts.length - 1;

        const isIndex = !isNaN(part);
        const key = isIndex ? parseInt(part, 10) : part;

        if (isLast) {
            if (Array.isArray(current) && typeof key === 'number') {
                if (key >= current.length || key < 0) {
                    throw new Error(`Invalid array index: ${key} at ${pathParts.slice(0, i).join('.')}`);
                }
                current[key] = valueToSet;
            } else if (typeof current === 'object' && current !== null) {
                current[key] = valueToSet;
            } else {
                throw new Error(`Cannot set value at ${keyPath}: target is not an object or array`);
            }
        } else {
            if (current[key] == null) {
                if (createMissing) {
                    const nextIsIndex = !isNaN(pathParts[i + 1]);
                    current[key] = nextIsIndex ? [] : {};
                } else {
                    throw new Error(`Path does not exist at '${pathParts.slice(0, i + 1).join('.')}'`);
                }
            }
            current = current[key];
        }
    }

    return newObj;
}

// const sdd = {
//     data: {
//       Name: ["Alice", "Bob", "Charlie"],
//       Age: [23, 30, 22]
//     }
//   };
  
//   // ✅ OK
//   console.log(sddSetValue(sdd, "data.Name.1", "XinTA"));
  
//   // ❌ Sai index -> lỗi
//   console.log(sddSetValue(sdd, "data.Name.100", "Oops")); // ❗ Lỗi: Invalid array index
  
//   // ❌ Sai path -> lỗi
//   console.log(sddSetValue(sdd, "data.WrongKey.0", "Oops")); // ❗ Lỗi: Path does not exist
  
//   // ✅ Cho phép tạo key nếu thiếu
//   console.log(sddSetValue({}, "a.b.c.0", 123, true, true));
  