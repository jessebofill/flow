import { outputHandleId } from '../../const/const';
import { registerNodeType } from '../../const/nodeTypes';
import { DataTypeNames } from '../../types/types';
import { defineHandles, isBangOutHandleId, NodeBase } from './NodeBase';

const handles = defineHandles({
    in: {
        dataType: DataTypeNames.Boolean,
    },
    [outputHandleId]: {
        dataType: DataTypeNames.Boolean
    }
});

@registerNodeType
export class SetBooleanNode extends NodeBase<typeof handles> {
    static defNodeName = 'Set Boolean';
    protected handleDefs = handles;
    protected isBangable = true;
    protected actionButtonText: string = 'Set';
    protected setDefaults(): void {
        this.state = {
            in: false,
            [outputHandleId]: false
        };
    }

    protected transform(id: string) {
        if (isBangOutHandleId(id)) {
            return this.state.in;
        }
        return null;
    }
}

