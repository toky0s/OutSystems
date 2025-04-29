// sddMerge.test.js
import { sddMerge } from './sddMerge';

describe('sddMerge - Left Join with joinOn', () => {
    const sdd1 = {
        definitions: {
            id: { kind: "number" },
            name: { kind: "string" }
        },
        data: {
            id: [1, 2, 3],
            name: ["Alice", "Bob", "Charlie"]
        }
    };

    const sdd2 = {
        definitions: {
            id: { kind: "number" },
            age: { kind: "number" }
        },
        data: {
            id: [2, 3, 4],
            age: [25, 30, 40]
        }
    };

    it('should left join on column "col-1" (id)', () => {
        const result = sddMerge(sdd1, sdd2, "Left Join", "col-1");

        expect(result.definitions).toEqual({
            id: { kind: "number" },
            name: { kind: "string" },
            age: { kind: "number" }
        });

        expect(result.data.id).toEqual([1, 2, 3]);
        expect(result.data.name).toEqual(["Alice", "Bob", "Charlie"]);
        expect(result.data.age).toEqual([null, 25, 30]);
    });

    it('should throw error for invalid joinOn (nonexistent column)', () => {
        expect(() => {
            sddMerge(sdd1, sdd2, "Left Join", "col-10");
        }).toThrow("Column index out of range for 'joinOn': col-10");
    });

    it('should throw error for missing joinOn when method is Left Join', () => {
        expect(() => {
            sddMerge(sdd1, sdd2, "Left Join");
        }).toThrow("Invalid or missing 'joinOn' parameter for Left Join.");
    });
});
