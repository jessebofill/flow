import type { ReactNode } from 'react';
import { outputHandleId } from '../../const/const';
import { registerNodeType } from '../../const/nodeTypes';
import { OperationSelector } from '../OperationSelector';
import { Operator, opMap, type MathOp } from '../OpIcons copy';
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
export class MathNode extends NodeBase<typeof handles> {
    static defNodeName = 'Math';
    protected handleDefs = handles;
    protected operator: MathOp = Operator.Add;

    protected setDefaults(): void {
        this.state = {
            p1: 0,
            p2: 0,
            [outputHandleId]: 0
        };
    }

    protected transform() {
        console.log('execdcdcdeee', this.state)
        if (this.state.p1 === undefined || this.state.p2 === undefined) return;
        return opMap[this.operator ].operation(this.state.p1, this.state.p2);
    }

    protected renderExtra(): ReactNode {
        return (
            <OperationSelector operators={[Operator.Add, Operator.Subtract, Operator.Multiply, Operator.Divide]} selected={this.operator} onChange={op => this.operator = op} />
        );
    }
}