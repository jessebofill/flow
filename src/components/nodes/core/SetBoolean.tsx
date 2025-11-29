import { mainOutputHandleId } from '../../../const/const';
import { registerNodeType } from '../../../const/nodeTypes';
import { DataTypeNames } from '../../../types/types';
import { NodeBase } from '../NodeBase';
import { defineHandles, isBangInHandleId } from '../../../const/utils';

const handles = defineHandles({
    in: {
        dataType: DataTypeNames.Boolean,
    },
    [mainOutputHandleId]: {
        dataType: DataTypeNames.Boolean
    }
});

@registerNodeType
export class SetBooleanNode extends NodeBase<typeof handles> {
    static defNodeName = 'Set Boolean';
    static isBangable = true;
    static description = 'Sets the output to the input boolean value.';

    protected get handleDefs() { return handles };
    protected actionButtonText: string = 'Set';
    protected setDefaults(): void {
        this.state = {
            handles: {
                in: false,
                [mainOutputHandleId]: false
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

