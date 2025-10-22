import { type ReactNode } from 'react';
import { outputHandleId } from '../../const/const';
import { registerNodeType } from '../../const/nodeTypes';
import { DataTypeNames } from '../../types/types';
import { defineHandles, NodeBase } from './NodeBase';
import { Operator, opMap, type BooleanOp } from '../OpIcons copy';
import { OperationSelector } from '../OperationSelector';

const arbitraryParamPrefix = 'p_';
function isArbitraryParam(hanldeId: string) {
    return hanldeId.startsWith(arbitraryParamPrefix);
}

function useArbitraryParam() {

}

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
    [outputHandleId]: {
        dataType: DataTypeNames.Boolean
    },
    signalOnTrue: {
        dataType: DataTypeNames.Bang,
        label: 'Signal if true'
    }
});

@registerNodeType
export class BooleanNode extends NodeBase<typeof handles> {
    static defNodeName = 'Boolean';
    protected handleDefs = handles;
    protected operator: BooleanOp = Operator.And;
    protected setDefaults(): void {
        this.state = {
            p_1: false,
            p_2: false,
            invert: false
        }
    }

    protected onOutputChange(prevValue: boolean | undefined, nextValue: boolean | undefined): void {
        if (nextValue) {
            this.bangThroughHandleId(this.handleDefToId(this.handleDefs.signalOnTrue)!);
        }
    }

    protected transform() {
        const p1 = this.state['p_1'];
        const p2 = this.state['p_2'];
        const invert = this.state.invert;
        if (p1 === undefined || p2 === undefined || invert === undefined) return;
        const val =  opMap[this.operator].operation(p1, p2);
        return invert ? !val : val;
    }

    protected renderExtra(): ReactNode {
        return (
            <OperationSelector operators={[Operator.And, Operator.Or]} selected={this.operator} onChange={op => this.operator = op} />
        );
    }
}

