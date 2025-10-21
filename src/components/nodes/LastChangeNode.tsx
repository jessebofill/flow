import { outputHandleId } from '../../const/const';
import { registerNodeType } from '../../const/nodeTypes';
import { defineHandles, NodeBase, type InputHandleId, type TransformId } from './NodeBase';

const handles = defineHandles({

    p1: {
        dataType: 'number'
    },
    p2: {
        dataType: 'number'
    },
    [outputHandleId]: {
        dataType: 'number'
    }
});

@registerNodeType
export class LastChanged extends NodeBase<typeof handles> {
    static defNodeName = 'Last Changed';
    protected handleDefs = handles;
    prevVals: { p1: number; p2: number } = { p1: 0, p2: 0 };

    protected setDefaults(): void {
        this.state = {
            p1: 0,
            p2: 0
        };
    }

    protected transform(id: InputHandleId<typeof this.handleDefs>) {
        return this.state[id];
    }
}