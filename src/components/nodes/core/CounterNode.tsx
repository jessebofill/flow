import type { ReactNode } from 'react';
import { mainOutputHandleId } from '../../../const/const';
import { registerNodeType } from '../../../const/nodeTypes';
import { DataTypeNames } from '../../../types/types';
import { OperationSelector } from '../../OperationSelector';
import { Operator, opMap, type CountOp } from '../../../const/opDefines';
import { NodeBase } from '../NodeBase';
import { defineHandles, isBangInHandleId } from '../../../const/utils';
import { Tags } from '../../../const/tags';

const handles = defineHandles({
    step: {
        dataType: DataTypeNames.Number,
        label: 'Step'
    },
    [mainOutputHandleId]: {
        dataType: DataTypeNames.Number
    }
})

@registerNodeType
export class CounterNode extends NodeBase<typeof handles> {
    static defNodeName = 'Counter';
    static isBangable: boolean = true;
    static tags = [Tags.Operation];
    static description = 'Increments or decrements output value by a given amount.';

    protected get handleDefs() { return handles };
    declare saveableState: { operator: CountOp };

    protected setDefaults(): void {
        this.state = {
            handles: {
                step: 1,
                [mainOutputHandleId]: 0
            }
        };

        this.saveableState = {
            operator: Operator.Increment
        };
    }

    protected transform(id: string | null): number | null | undefined {
        if (isBangInHandleId(id)) {
            const step = this.state.handles.step;
            const accum = this.state.handles[mainOutputHandleId];
            if (step === undefined || accum === undefined) return;
            return opMap[this.saveableState.operator].operation(accum, step);
        }
        return null;
    }

    protected renderExtra(): ReactNode {
        return (
            <OperationSelector operators={[Operator.Increment, Operator.Decrement]} selected={this.saveableState.operator} onChange={op => this.saveableState.operator = op} />
        );
    }
}