import { type ReactNode } from 'react';
import { mainOutputHandleId, seqOutHandleIdPrefix, variadicInHandleIdPrefix } from '../../../const/const';
import { registerNodeType } from '../../../const/nodeTypes';
import { DataTypeNames } from '../../../types/types';
import { NodeBase } from '../NodeBase';
import { defineHandles } from '../../../const/utils';
import { Operator, opMap, type BooleanOp } from '../../../const/opDefines';
import { OperationSelector } from '../../OperationSelector';
import { Tags } from '../../../const/tags';

const signalTrueId = `${seqOutHandleIdPrefix}signalTrue`;
const varaiadicOperandId = `${variadicInHandleIdPrefix}param`;

const handles = defineHandles({
    [varaiadicOperandId]: {
        dataType: DataTypeNames.Boolean,
    },
    invert: {
        dataType: DataTypeNames.Boolean,
        label: 'Invert'
    },
    [mainOutputHandleId]: {
        dataType: DataTypeNames.Boolean
    },
    [signalTrueId]: {
        dataType: DataTypeNames.Bang,
        label: 'Signal if true'
    }
});

@registerNodeType
export class BooleanNode extends NodeBase<typeof handles> {
    static defNodeName = 'Boolean';
    static tags = [Tags.Operation];
    protected get handleDefs() { return handles };
    declare saveableState: { operator: BooleanOp };

    protected setDefaults(): void {
        this.state = {
            handles: {
                invert: false
            }
        }
        this.variadicHandleDefaults = {
            [varaiadicOperandId]: false
        }
        this.saveableState = {
            operator: Operator.And
        };
    }

    protected async onOutputChange(prevValue: boolean | undefined, nextValue: boolean | undefined) {
        if (nextValue) {
            await this.exeTargetCallbacks(signalTrueId);
        }
    }

    protected transform() {
        const operands = Object.entries(this.state.handles).filter(([key]) => key.startsWith(varaiadicOperandId)).map(([_, value]) => value);
        const invert = this.state.handles.invert;
        const val = opMap[this.saveableState.operator].operation(...operands);
        return invert ? !val : val;
    }

    protected renderExtra(): ReactNode {
        return (
            <OperationSelector operators={[Operator.And, Operator.Or]} selected={this.saveableState.operator} onChange={op => this.saveableState.operator = op} />
        );
    }
}

