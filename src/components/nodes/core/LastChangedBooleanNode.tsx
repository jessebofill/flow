import { mainOutputHandleId } from '../../../const/const';
import { registerNodeType } from '../../../const/nodeTypes';
import { DataTypeNames } from '../../../types/types';
import { NodeBase, type InputHandleId } from '../NodeBase';
import { defineHandles } from '../../../const/utils';

const handles = defineHandles({

    p1: {
        dataType: DataTypeNames.Boolean
    },
    p2: {
        dataType: DataTypeNames.Boolean
    },
    [mainOutputHandleId]: {
        dataType: DataTypeNames.Boolean
    }
});

@registerNodeType
export class LastChangedBoolean extends NodeBase<typeof handles> {
    static defNodeName = 'Last Changed Boolean';
    protected get handleDefs() { return handles };
    prevVals: { p1: number; p2: number } = { p1: 0, p2: 0 };

    protected setDefaults(): void {
        this.state = {
            handles: {
                p1: false,
                p2: false
            }
        };
    }

    protected transform(id: InputHandleId<typeof this.handleDefs>) {
        return this.state.handles[id];
    }
}