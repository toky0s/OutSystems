const csv1 = `
Name,Age,IsStudent
Alice,23,true
Bob,30,false
Charlie,22,true
`

const sdd = SddOperator.csvToSdd(csv1, 'String', [
    { Column: 'Age', Type: 'Number' },
    { Column: 'IsStudent', Type: 'Boolean' }
]);
console.log(JSON.stringify(sdd, null, 2));