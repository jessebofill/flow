import type { ReactNode } from 'react';
import { mainOutputHandleId } from '../../../const/const';
import { registerNodeType } from '../../../const/nodeTypes';
import { OperationSelector } from '../../OperationSelector';
import { Operator, opMap, type MathOp } from '../../../const/opDefines';
import { NodeBase } from '../NodeBase';
import { defineHandles } from '../../../const/utils';
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
    static description = 'Performs modulus operation and allows result to be offset by a given amount.';

    static tags = [Tags.Operation];
    protected get handleDefs() { return handles };

    protected setDefaults(): void {
        this.state = {
            handles: {
                p1: 1,
                p2: 1,
                offset: 0,
                [mainOutputHandleId]: 0
            }
        };
    }

    protected transform() {
        if (this.state.handles.p1 === undefined || this.state.handles.p2 === undefined) return;
        const val = opMap['%'].operation(this.state.handles.p1, this.state.handles.p2);
        return isNaN(val) ? undefined : val + (this.state.handles.offset ?? 0);
    }
}