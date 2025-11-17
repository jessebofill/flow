import { mainOutputHandleId } from '../../../const/const';
import { registerNodeType } from '../../../const/nodeTypes';
import { DataTypeNames } from '../../../types/types';
import { NodeBase } from '../NodeBase';
import { defineHandles, isBangInHandleId } from '../../../const/utils';

const handles = defineHandles({
    in: {
        dataType: DataTypeNames.Number,
    },
    [mainOutputHandleId]: {
        dataType: DataTypeNames.Number
    }
});

@registerNodeType
export class SetNumberNode extends NodeBase<typeof handles> {
    static defNodeName = 'Set Number';
    static isBangable = true;
    protected get handleDefs() { return handles };
    protected actionButtonText: string = 'Set';
    protected setDefaults(): void {
        this.state = {
            handles: {
                in: 0,
                [mainOutputHandleId]: 0
            }
        };
    }

    protected transform(id: string | null) {
        if (isBangInHandleId(id)) {
            return this.state.handles.in;
        }
        return null;
    }
}

