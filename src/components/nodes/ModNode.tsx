import type { ReactNode } from 'react';
import { outputHandleId } from '../../const/const';
import { registerNodeType } from '../../const/nodeTypes';
import { OperationSelector } from '../OperationSelector';
import { Operator, opMap, type MathOp } from '../../const/opDefines';
import { defineHandles, NodeBase } from './NodeBase';
import { DataTypeNames } from '../../types/types';

const handles = defineHandles({

    p1: {
        dataType: DataTypeNames.Number
    },
    p2: {
        dataType: DataTypeNames.Number
    },
    [outputHandleId]: {
        dataType: DataTypeNames.Number
    }
});

@registerNodeType
export class ModNode extends NodeBase<typeof handles> {
    static defNodeName = 'Modulus';
    protected handleDefs = handles;
    protected operator: MathOp = Operator.Add;

    protected setDefaults(): void {
        this.state = {
            p1: 1,
            p2: 1,
            [outputHandleId]: 0
        };
    }

    protected transform() {
        if (this.state.p1 === undefined || this.state.p2 === undefined) return;
        const val = opMap['%'].operation(this.state.p1, this.state.p2);
        return isNaN(val) ? undefined : val;
    }
}