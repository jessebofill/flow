import { mainOutputHandleId } from '../../const/const';
import { registerNodeType } from '../../const/nodeTypes';
import { DataTypeNames } from '../../types/types';
import { defineHandles, isBangInHandleId, NodeBase } from './NodeBase';

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
    protected handleDefs = handles;
    protected isBangable = true;
    protected actionButtonText: string = 'Set';
    protected setDefaults(): void {
        this.state = {
            in: 0,
            [mainOutputHandleId]: 0
        };
    }

    protected transform(id: string) {
        if (isBangInHandleId(id)) {
            return this.state.in;
        }
        return null;
    }
}

