import type { ReactNode } from 'react';
import { mainOutputHandleId } from '../../const/const';
import { registerNodeType } from '../../const/nodeTypes';
import { DataTypeNames } from '../../types/types';
import { OperationSelector } from '../OperationSelector';
import { Operator, opMap, type ComparisonOp } from '../../const/opDefines';
import { defineHandles, NodeBase } from './NodeBase';

const handles = defineHandles({
    p1: {
        dataType: DataTypeNames.Number,
    },
    p2: {
        dataType: DataTypeNames.Number,
    },
    [mainOutputHandleId]: {
        dataType: DataTypeNames.Boolean
    }
})

@registerNodeType
export class ComparisonNode extends NodeBase<typeof handles> {
    static defNodeName = 'Comparison';
    protected handleDefs = handles;
    declare saveableState: { operator: ComparisonOp };

    protected setDefaults(): void {
        this.state = {
            p1: 0,
            p2: 1,
            [mainOutputHandleId]: false
        };

        this.saveableState = {
            operator: Operator.Equal
        };
    }

    protected transform(): boolean | null | undefined {
        const p1 = this.state.p1;
        const p2 = this.state.p2;
        if (p1 === undefined || p2 === undefined) return;
        return Boolean(opMap[this.saveableState.operator].operation(p1, p2));
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
                selected={this.saveableState.operator}
                onChange={op => this.saveableState.operator = op}
            />
        );
    }
}