import type { ReactNode } from 'react';
import { outputHandleId } from '../../const/const';
import { registerNodeType } from '../../const/nodeTypes';
import { DataTypeNames } from '../../types/types';
import { OperationSelector } from '../OperationSelector';
import { Operator, opMap, type CountOp } from '../../const/opDefines';
import { defineHandles, isBangOutHandleId, NodeBase } from './NodeBase';

const handles = defineHandles({
    step: {
        dataType: DataTypeNames.Number,
        label: 'Step'
    },
    [outputHandleId]: {
        dataType: DataTypeNames.Number
    }
})

@registerNodeType
export class CounterNode extends NodeBase<typeof handles> {
    static defNodeName = 'Counter';
    protected handleDefs = handles;
    protected isBangable: boolean = true;
    protected operator: CountOp = Operator.Increment;

    protected setDefaults(): void {
        this.state = {
            step: 1,
            [outputHandleId]: 0
        };
    }

    protected transform(id: string): number | null | undefined {
        if (isBangOutHandleId(id)) {
            const step = this.state.step;
            const accum = this.state[outputHandleId];
            if (step === undefined || accum === undefined) return;
            return opMap[this.operator].operation(accum, step);
        }
        return null;
    }

    protected renderExtra(): ReactNode {
        return (
            <OperationSelector operators={[Operator.Increment, Operator.Decrement]} selected={this.operator} onChange={op => this.operator = op} />
        );
    }
}