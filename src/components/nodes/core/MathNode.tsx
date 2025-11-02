import type { ReactNode } from 'react';
import { mainOutputHandleId } from '../../../const/const';
import { registerNodeType } from '../../../const/nodeTypes';
import { OperationSelector } from '../../OperationSelector';
import { Operator, opMap, type MathOp } from '../../../const/opDefines';
import { defineHandles, NodeBase } from '../NodeBase';
import { DataTypeNames } from '../../../types/types';
import { Tags } from '../../../const/tags';

const handles = defineHandles({

    p1: {
        dataType: DataTypeNames.Number
    },
    p2: {
        dataType: DataTypeNames.Number
    },
    [mainOutputHandleId]: {
        dataType: DataTypeNames.Number
    }
});

@registerNodeType
export class MathNode extends NodeBase<typeof handles> {
    static defNodeName = 'Math';
    static tags = [Tags.Operation];
    protected handleDefs = handles;
    declare saveableState: { operator: MathOp };

    protected setDefaults(): void {
        this.state = {
            p1: 0,
            p2: 0,
            [mainOutputHandleId]: 0
        };

        this.saveableState = {
            operator: Operator.Add
        }
    }

    protected transform() {
        if (this.state.p1 === undefined || this.state.p2 === undefined) return;
        return opMap[this.saveableState.operator].operation(this.state.p1, this.state.p2);
    }

    protected renderExtra(): ReactNode {
        return (
            <OperationSelector operators={[Operator.Add, Operator.Subtract, Operator.Multiply, Operator.Divide]} selected={this.saveableState.operator} onChange={op => this.saveableState.operator = op} />
        );
    }
}