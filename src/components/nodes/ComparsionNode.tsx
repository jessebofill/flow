import type { ReactNode } from 'react';
import { outputHandleId } from '../../const/const';
import { registerNodeType } from '../../const/nodeTypes';
import { DataTypeNames } from '../../types/types';
import { OperationSelector } from '../OperationSelector';
import { Operator, opMap, type ComparisonOp, type CountOp } from '../../const/opDefines';
import { defineHandles, isBangOutHandleId, NodeBase } from './NodeBase';

const handles = defineHandles({
    p1: {
        dataType: DataTypeNames.Number,
    },
    p2: {
        dataType: DataTypeNames.Number,
    },
    [outputHandleId]: {
        dataType: DataTypeNames.Boolean
    }
})

@registerNodeType
export class ComparisonNode extends NodeBase<typeof handles> {
    static defNodeName = 'Comparison';
    protected handleDefs = handles;
    protected operator: ComparisonOp = Operator.Equal;

    protected setDefaults(): void {
        this.state = {
            p1: 0,
            p2: 1,
            [outputHandleId]: false
        };
    }

    protected transform(): boolean | null | undefined {
        const p1 = this.state.p1;
        const p2 = this.state.p2;
        if (p1 === undefined || p2 === undefined) return;
        return Boolean(opMap[this.operator].operation(p1, p2));
    }

    protected renderExtra(): ReactNode {
        return (
            <OperationSelector
                operators={[
                    Operator.Equal,
                    Operator.NotEqual,
                    Operator.Greater,
                    Operator.Less,
                    Operator.GreaterEqual,
                    Operator.LessEqual
                ]}
                selected={this.operator}
                onChange={op => this.operator = op}
            />
        );
    }
}