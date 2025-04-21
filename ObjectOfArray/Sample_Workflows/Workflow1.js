const selectedEntity = "petronas"
// const outputMcaRaw = JSON.parse($parameters.OutputMcaRaw)
// const outputMca = JSON.parse($parameters.OutputMca)
// const pnlSummary = JSON.parse($parameters.PnlSummary)
const isExcessView = false
const isBceView = false
const isShortfallView = false
const bceValue = 0.065

const DaisAggregate = aggregateSDD
// const DaisAddModifyColumn = DaisAddModifyColumn
const DaisFilterOnColumn = filterSDD
// const DaisMerge = DaisMerge

///////////// COMMON ////////////////////
const aggregatedDateSum = DaisAggregate(
    outputMcaRaw,
    ["date"],
    [
        { InColumn: "Parcel Size", Method: 'Sum', WhatTodoWithANullVale: 0 },
    ]
)

const sddAddedParcelSizeCol = DaisAddModifyColumn(aggregatedDateSum, "Parcel Size", "Add column with static value", {
    columnType: "Auto",
    value: 0
})
///////////// COMMON ////////////////////

///////////// DEMAND ////////////////////
const aggregatedDemandSum = DaisAggregate(
    outputMcaRaw,
    ["date", "Entities", "Demand Type"],
    [
        { InColumn: "Parcel Size", Method: 'Sum', WhatTodoWithANullVale: 0 },
    ]
)

console.log("outputMcaRaw", outputMcaRaw)
console.log("aggregatedDemandSum", aggregatedDemandSum)

const filteredDemandEntitesSdd = DaisFilterOnColumn(aggregatedDemandSum, "Entities", "Value equals", selectedEntity)
let sddFilteredByDemandType
if (isExcessView) {
    sddFilteredByDemandType = DaisFilterOnColumn(filteredDemandEntitesSdd, "Demand Type", "Value is in array", [
        'spot',
        'spot_mlng',
    ])
}
else {
    sddFilteredByDemandType = filteredDemandEntitesSdd
}
const sddDemandVolumes = DaisMerge(sddFilteredByDemandType, sddAddedParcelSizeCol, "Append (loose)")
///////////// DEMAND ////////////////////

///////////// SUPPLY ////////////////////
const aggregatedSupplySum = DaisAggregate(
    outputMcaRaw,
    ["date", "Entities", "Supplier"],
    [
        { InColumn: "Parcel Size", Method: 'Sum', WhatTodoWithANullVale: 0 },
    ]
)

const filteredSupplyEntitesSdd = DaisFilterOnColumn(aggregatedSupplySum, "Entities", "Value equals", selectedEntity)
let sddFilteredBySupplier
if (isShortfallView) {

}
else {
    sddFilteredBySupplier = DaisFilterOnColumn(filteredSupplyEntitesSdd, "Supplier", "Value equals", 'JKM')
}
const sddSupplyVolumes = DaisMerge(sddFilteredBySupplier, sddAddedParcelSizeCol, "Append (loose)")
///////////// SUPPLY ////////////////////

let leftDemandVolumes, rightSupplyVolumes, tooltips, unit
if (isBceView) {
    leftDemandVolumes = DaisAddModifyColumn(sddDemandVolumes, "Parcel Size", "Add/subtract/divide/multiply by static value", {
        lhs: "Parcel Size",
        operation: "Divide",
        rhsValue: bceValue
    })

    rightSupplyVolumes = DaisAddModifyColumn(sddSupplyVolumes, "Parcel Size", "Add/subtract/divide/multiply by static value", {
        lhs: "Parcel Size",
        operation: "Divide",
        rhsValue: bceValue
    })

    tooltips = {
        prefix: '',
        suffix: ' BCE',
        useLocale: true,
        capitalize: true,
        multiplier: 'auto',
        decimalPlaces: 1,
        decimalPlacesMode: 'alwaysShow',
    }
    unit = 'BCE'
}
else {
    leftDemandVolumes = sddDemandVolumes
    rightSupplyVolumes = sddSupplyVolumes
    tooltips = {
        prefix: '',
        suffix: ' MT',
        useLocale: true,
        capitalize: true,
        multiplier: 'auto',
        decimalPlaces: 3,
        decimalPlacesMode: 'alwaysShow',
    }
    unit = 'MT'
}

console.log(leftDemandVolumes)
console.log(rightSupplyVolumes)
console.log(tooltips)
console.log(unit)

$parameters.DemandVolumes = leftDemandVolumes
$parameters.SupplyVolumes = rightSupplyVolumes
$parameters.Tooltips = tooltips
$parameters.Unit = unit

const outputMcaFiltered = DaisFilterOnColumn(outputMca, "Entities", "Value equals", selectedEntity)
$parameters.OutputMcaFiltered = JSON.stringify(outputMcaFiltered)

const pnlSummaryFiltered = DaisFilterOnColumn(pnlSummary, "Entities", "Value equals", selectedEntity)
$parameters.PnlSummaryFiltered = JSON.stringify(pnlSummaryFiltered)