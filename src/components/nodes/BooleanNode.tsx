import { useEffect, useRef, useState, type FC, type ReactNode } from 'react';
import { ouputHandleId } from '../../const/const';
import { registerNodeType } from '../../const/nodeTypes';
import { DataTypeNames } from '../../types/types';
import { defineHandles, NodeBase } from './NodeBase copy';
import { AndIcon, DivideIcon, MinusIcon, MultiplyIcon, OrIcon, PlusIcon } from '../OpIcons';
import { Operator, opMap, type BooleanOp, type OpEntry } from '../OpIcons copy';
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
    [ouputHandleId]: {
        dataType: DataTypeNames.Boolean
    },
    bangOnTrue: {
        dataType: DataTypeNames.Bang,
        label: <div>
            Run if
            <br />
            true
        </div>
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
        }
    }

    protected onOutputChange(prevValue: boolean | undefined, nextValue: boolean | undefined): void {
        if (prevValue !== nextValue && nextValue) {
            this.bangThroughHandleId(this.handleDefToId(this.handleDefs.bangOnTrue)!);
        }
    }

    protected transform() {
        console.log('operator', this.operator)
        const p1 = this.state['p_1'];
        const p2 = this.state['p_2'];
        if (p1 === undefined || p2 === undefined) return;
        return opMap[this.operator ].operation(p1, p2);
    }

    protected renderExtra(): ReactNode {
        return (
            <OperationSelector operators={[Operator.And, Operator.Or]} selected={this.operator} onChange={op => this.operator = op}/>
        );
    }
}

