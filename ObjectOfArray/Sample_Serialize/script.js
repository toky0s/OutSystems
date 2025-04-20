let onComplete = (output) => {
    console.log(output)
}
//create some random data 
// convertSDDToArrayAsync(sdd=sampleJSONScenarioList, onComplete=onComplete)
convertSDDToArrayAsync(sampleJSONScenarioList, 1000,
    (done, total) => console.log(`Progress: ${done}/${total}`),
    (result) => {
        createGrid(result)
    }
);


const createGrid = (data) => {
    var theGrid = new wijmo.grid.FlexGrid('#theGrid', {
        autoGenerateColumns: true,
        itemsSource: data
    });
    var filter = new wijmo.grid.filter.FlexGridFilter(theGrid);
    document.querySelector("#cbShowIncludeSelection").addEventListener("change", (e) => {
        filter.showIncludeSelection = e.target.checked;
    });
}
