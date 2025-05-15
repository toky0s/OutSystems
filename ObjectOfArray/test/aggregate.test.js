// test/aggregate.test.js
import { expect } from "chai";
import "../dist/sdd-operator.js";
import { sddAggregate } from "../src/Aggregate.js";

describe("sddAggregate", () => {
    it("should sum numeric values correctly", () => {
        const sdd = {
            data: {
                group: ["A", "A", "B"],
                val: [1, 2, 10],
            },
            definitions: {
                group: { kind: "string", optional: false },
                val: { kind: "number", optional: false },
            },
        };

        const result = sddAggregate(sdd, ["group"], [
            { InColumn: "val", Method: "Sum", WhatTodoWithANullVale: 0 },
        ]);

        expect(result.data.group).to.deep.equal(["A", "B"]);
        expect(result.data.val).to.deep.equal([3, 10]);
    });

    it("For Sdd with 3 columns, it should sum numeric values collectly", () => {
        const sdd = {
            data: {
                group: ["A", "A", "B", "C", "C", "B", "A"],
                age: [10, 10, 9, 8, 8, 9, 11],
                val: [1, 2, 10, 5, 6, 5, 8],
            },
            definitions: {
                group: { kind: "string", optional: false },
                val: { kind: "number", optional: false },
                age: { kind: "number", optional: false },
            },
        };

        const result = sddAggregate(sdd, ["group", "age"], [
            { InColumn: "val", Method: "Sum", WhatTodoWithANullVale: 0 },
        ]);

        expect(result.data.group).to.deep.equal(["A", "B", "C", "A"]);
        expect(result.data.age).to.deep.equal([10, 9, 8, 11]);
        expect(result.data.val).to.deep.equal([3, 15, 11, 8]);
    })

    it("should handle missing InColumn gracefully by creating a null column", () => {
        const sdd = {
            data: {
                group: ["X", "Y"],
            },
            definitions: {
                group: { kind: "string", optional: false },
            },
        };

        const result = sddAggregate(sdd, ["group"], [
            { InColumn: "notExist", Method: "Sum", WhatTodoWithANullVale: 0 },
        ]);

        expect(result.data.group).to.deep.equal(["X", "Y"]);
        expect(result.data.notExist).to.deep.equal([0, 0]);
    });

    it("should return null if null exists and WhatTodoWithANullVale is null", () => {
        const sdd = {
            data: {
                group: ["A", "A"],
                val: [1, null],
            },
            definitions: {
                group: { kind: "string", optional: false },
                val: { kind: "number", optional: true },
            },
        };

        const result = sddAggregate(sdd, ["group"], [
            { InColumn: "val", Method: "Sum", WhatTodoWithANullVale: null },
        ]);

        expect(result.data.val).to.deep.equal([null]);
    });

    it("should calculate Count and Unique Count correctly", () => {
        const sdd = {
            data: {
                group: ["A", "A", "A"],
                val: [1, 1, null],
            },
            definitions: {
                group: { kind: "string", optional: false },
                val: { kind: "number", optional: true },
            },
        };

        const result = sddAggregate(sdd, ["group"], [
            { InColumn: "val", Method: "Count", WhatTodoWithANullVale: 0 },
            { InColumn: "val", Method: "Unique Count", WhatTodoWithANullVale: 0 },
        ]);

        expect(result.data.val[0]).to.equal(2); // Count (non-null)
        expect(result.data.val[1]).to.equal(1); // Unique count
    });

    it("should support First non-null value", () => {
        const sdd = {
            data: {
                group: ["A", "A", "A"],
                val: [null, "hello", "world"],
            },
            definitions: {
                group: { kind: "string", optional: false },
                val: { kind: "string", optional: true },
            },
        };

        const result = sddAggregate(sdd, ["group"], [
            { InColumn: "val", Method: "First" },
        ]);

        expect(result.data.val[0]).to.equal("hello");
    });

    it("should support Last non-null value", () => {
        const sdd = {
            data: {
                group: ["A", "A", "A"],
                val: [null, "hello", "world"],
            },
            definitions: {
                group: { kind: "string", optional: false },
                val: { kind: "string", optional: true },
            },
        };

        const result = sddAggregate(sdd, ["group"], [
            { InColumn: "val", Method: "Last" },
        ]);

        expect(result.data.val[0]).to.equal("world");
    });
});
