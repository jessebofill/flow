import type { ReactNode } from 'react';
import { mainOutputHandleId } from '../../../const/const';
import { registerNodeType } from '../../../const/nodeTypes';
import { DataTypeNames } from '../../../types/types';
import { OperationSelector } from '../../OperationSelector';
import { Operator, opMap, type CountOp } from '../../../const/opDefines';
import { defineHandles, isBangInHandleId, NodeBase } from '../NodeBase';
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
    protected handleDefs = handles;
    declare saveableState: { operator: CountOp };

    protected setDefaults(): void {
        this.state = {
            step: 1,
            [mainOutputHandleId]: 0
        };

        this.saveableState = {
            operator: Operator.Increment
        };
    }

    protected transform(id: string): number | null | undefined {
        if (isBangInHandleId(id)) {
            const step = this.state.step;
            const accum = this.state[mainOutputHandleId];
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