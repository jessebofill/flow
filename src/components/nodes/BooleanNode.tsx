import { type ReactNode } from 'react';
import { mainOutputHandleId, variOutHandleIdPrefix } from '../../const/const';
import { registerNodeType } from '../../const/nodeTypes';
import { DataTypeNames } from '../../types/types';
import { defineHandles, NodeBase } from './NodeBase';
import { Operator, opMap, type BooleanOp } from '../../const/opDefines';
import { OperationSelector } from '../OperationSelector';
import { Tags } from '../../const/tags';

const arbitraryParamPrefix = 'p_';
function isArbitraryParam(hanldeId: string) {
    return hanldeId.startsWith(arbitraryParamPrefix);
}

function useArbitraryParam() {

}

const signalTrueId = `${variOutHandleIdPrefix}signalTrue`;

const handles = defineHandles({

    p_1: {
        dataType: DataTypeNames.Boolean
    },
    p_2: {
        dataType: DataTypeNames.Boolean
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
    protected handleDefs = handles;
    declare saveableState: { operator: BooleanOp };
    
    protected setDefaults(): void {
        this.state = {
            p_1: false,
            p_2: false,
            invert: false
        }
        this.saveableState = {
            operator: Operator.And
        };
    }

    protected onOutputChange(prevValue: boolean | undefined, nextValue: boolean | undefined): void {
        if (nextValue) {
            this.exeTargetCallbacks(this.handleDefToId(this.handleDefs[signalTrueId])!);
        }
    }

    protected transform() {
        const p1 = this.state['p_1'];
        const p2 = this.state['p_2'];
        const invert = this.state.invert;
        if (p1 === undefined || p2 === undefined || invert === undefined) return;
        const val = opMap[this.saveableState.operator].operation(p1, p2);
        return invert ? !val : val;
    }

    protected renderExtra(): ReactNode {
        return (
            <OperationSelector operators={[Operator.And, Operator.Or]} selected={this.saveableState.operator} onChange={op => this.saveableState.operator = op} />
        );
    }
}

