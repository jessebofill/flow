import { mainOutputHandleId } from '../../const/const';
import { registerNodeType } from '../../const/nodeTypes';
import { DataTypeNames } from '../../types/types';
import { defineHandles, isBangInHandleId, NodeBase } from './NodeBase';

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
    protected handleDefs = handles;
    protected actionButtonText: string = 'Set';
    protected setDefaults(): void {
        this.state = {
            in: false,
            [mainOutputHandleId]: false
        };
    }

    protected transform(id: string) {
        if (isBangInHandleId(id)) {
            return this.state.in;
        }
        return null;
    }
}

