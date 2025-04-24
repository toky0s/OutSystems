import { sddAddModifyColumn } from './AddModifyColumn'
import { sddMerge } from './Merge'
import { sddAggregate } from './Aggregate'
import { sddFilter } from './Filter'
import { sddColumnToArray } from './ColumnToArray'
import { sddConvertSddToArrayAsync } from './Serialize'
import { 
    sddDeleteColumn, 
    sddDeleteColumnsInArray, 
    sddDeleteColumnsNotInArray, 
    sddDuplicateColumn, 
    sddRenameColumn
} from './OperateOnColumn'

export const SddOperator = {
    sddMerge: sddMerge,
    sddAddModifyColumn: sddAddModifyColumn,
    sddAggregate: sddAggregate,
    sddFilter: sddFilter,
    sddColumnToArray: sddColumnToArray,
    sddConvertSddToArrayAsync: sddConvertSddToArrayAsync,
    sddDeleteColumn: sddDeleteColumn,
    sddDeleteColumnsInArray: sddDeleteColumnsInArray,
    sddDeleteColumnsNotInArray: sddDeleteColumnsNotInArray,
    sddDuplicateColumn: sddDuplicateColumn,
    sddRenameColumn: sddRenameColumn
}