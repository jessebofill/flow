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
    offset: {
        dataType: DataTypeNames.Number,
        label: 'Offset'
    },
    [mainOutputHandleId]: {
        dataType: DataTypeNames.Number
    }
});

@registerNodeType
export class ModNode extends NodeBase<typeof handles> {
    static defNodeName = 'Modulus';
    static tags = [Tags.Operation];
    protected handleDefs = handles;

    protected setDefaults(): void {
        this.state = {
            p1: 1,
            p2: 1,
            offset: 0,
            [mainOutputHandleId]: 0
        };
    }

    protected transform() {
        if (this.state.p1 === undefined || this.state.p2 === undefined) return;
        const val = opMap['%'].operation(this.state.p1, this.state.p2);
        return isNaN(val) ? undefined : val + (this.state.offset ?? 0);
    }
}