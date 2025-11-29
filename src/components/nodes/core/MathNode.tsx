import type { ReactNode } from 'react';
import { mainOutputHandleId, variadicInHandleIdPrefix } from '../../../const/const';
import { registerNodeType } from '../../../const/nodeTypes';
import { OperationSelector } from '../../OperationSelector';
import { Operator, opMap, type MathOp } from '../../../const/opDefines';
import { NodeBase } from '../NodeBase';
import { defineHandles } from '../../../const/utils';
import { DataTypeNames } from '../../../types/types';
import { Tags } from '../../../const/tags';

const varaiadicOperandId = `${variadicInHandleIdPrefix}operand`;

const handles = defineHandles({

    [varaiadicOperandId]: {
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
    static description = 'Performs the basic math operations on a variable number of operands.';

    protected get handleDefs() { return handles };
    declare saveableState: { operator: MathOp };

    protected setDefaults(): void {
        this.state = {
            handles: {
                [mainOutputHandleId]: 0
            }
        };

        this.variadicHandleDefaults = {
            [varaiadicOperandId]: 0
        }

        this.saveableState = {
            operator: Operator.Add
        }
    }

    protected transform() {
        const operands = Object.entries(this.state.handles).filter(([key]) => key.startsWith(varaiadicOperandId)).map(([_, value]) => value);
        return opMap[this.saveableState.operator].operation(...operands as number[]);
    }

    protected renderExtra(): ReactNode {
        const onOpChange = (op: MathOp) => {
            this.saveableState.operator = op;
            this.transformInput();
        };
        return (
            <OperationSelector operators={[Operator.Add, Operator.Subtract, Operator.Multiply, Operator.Divide]} selected={this.saveableState.operator} onChange={onOpChange} />
        );
    }
}