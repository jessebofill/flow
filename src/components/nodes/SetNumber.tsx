import { outputHandleId } from '../../const/const';
import { registerNodeType } from '../../const/nodeTypes';
import { DataTypeNames } from '../../types/types';
import { defineHandles, isBangOutHandleId, NodeBase } from './NodeBase';

const handles = defineHandles({
    in: {
        dataType: DataTypeNames.Number,
    },
    [outputHandleId]: {
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
            [outputHandleId]: 0
        };
    }

    protected transform(id: string) {
        if (isBangOutHandleId(id)) {
            return this.state.in;
        }
        return null;
    }
}

