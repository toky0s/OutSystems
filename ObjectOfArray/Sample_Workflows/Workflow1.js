const selectedEntity = "petronas"
// const outputMcaRaw = JSON.parse($parameters.OutputMcaRaw)
// const outputMca = JSON.parse($parameters.OutputMca)
// const pnlSummary = JSON.parse($parameters.PnlSummary)
const isExcessView = false
const isBceView = false
const isShortfallView = false
const bceValue = 0.065

///////////// COMMON ////////////////////
const aggregatedDateSum = SddOperator.sddAggregate(
    outputMcaRaw,
    ["date"],
    [
        { InColumn: "Parcel Size", Method: 'Sum', WhatTodoWithANullVale: 0 },
    ]
)

const sddAddedParcelSizeCol = SddOperator.sddAddModifyColumn(aggregatedDateSum, "Parcel Size", "Add column with static value", {
    columnType: "Auto",
    value: 0
})
///////////// COMMON ////////////////////

///////////// DEMAND ////////////////////
const aggregatedDemandSum = SddOperator.sddAggregate(
    outputMcaRaw,
    ["date", "Entities", "Demand Type"],
    [
        { InColumn: "Parcel Size", Method: 'Sum', WhatTodoWithANullVale: 0 },
    ]
)

console.log("outputMcaRaw", outputMcaRaw)
console.log("aggregatedDemandSum", aggregatedDemandSum)

const filteredDemandEntitesSdd = SddOperator.sddFilter(aggregatedDemandSum, "Entities", "Value equals", selectedEntity)
let sddFilteredByDemandType
if (isExcessView) {
    sddFilteredByDemandType = SddOperator.sddFilter(filteredDemandEntitesSdd, "Demand Type", "Value is in array", [
        'spot',
        'spot_mlng',
    ])
}
else {
    sddFilteredByDemandType = filteredDemandEntitesSdd
}
const sddDemandVolumes = SddOperator.sddMerge(sddFilteredByDemandType, sddAddedParcelSizeCol, "Append (loose)")
///////////// DEMAND ////////////////////

///////////// SUPPLY ////////////////////
const aggregatedSupplySum = SddOperator.sddAggregate(
    outputMcaRaw,
    ["date", "Entities", "Supplier"],
    [
        { InColumn: "Parcel Size", Method: 'Sum', WhatTodoWithANullVale: 0 },
    ]
)

const filteredSupplyEntitesSdd = SddOperator.sddFilter(aggregatedSupplySum, "Entities", "Value equals", selectedEntity)
let sddFilteredBySupplier
if (isShortfallView) {

}
else {
    sddFilteredBySupplier = SddOperator.sddFilter(filteredSupplyEntitesSdd, "Supplier", "Value equals", 'JKM')
}
const sddSupplyVolumes = SddOperator.sddMerge(sddFilteredBySupplier, sddAddedParcelSizeCol, "Append (loose)")
///////////// SUPPLY ////////////////////

let leftDemandVolumes, rightSupplyVolumes, tooltips, unit
if (isBceView) {
    leftDemandVolumes = SddOperator.sddAddModifyColumn(sddDemandVolumes, "Parcel Size", "Add/subtract/divide/multiply by static value", {
        lhs: "Parcel Size",
        operation: "Divide",
        rhsValue: bceValue
    })

    rightSupplyVolumes = SddOperator.sddAddModifyColumn(sddSupplyVolumes, "Parcel Size", "Add/subtract/divide/multiply by static value", {
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

const outputMcaFiltered = SddOperator.sddFilter(outputMca, "Entities", "Value equals", selectedEntity)
$parameters.OutputMcaFiltered = JSON.stringify(outputMcaFiltered)

const pnlSummaryFiltered = SddOperator.sddFilter(pnlSummary, "Entities", "Value equals", selectedEntity)
$parameters.PnlSummaryFiltered = JSON.stringify(pnlSummaryFiltered)