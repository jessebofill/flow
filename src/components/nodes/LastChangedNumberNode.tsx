import { mainOutputHandleId } from '../../const/const';
import { registerNodeType } from '../../const/nodeTypes';
import { DataTypeNames } from '../../types/types';
import { defineHandles, NodeBase, type InputHandleId } from './NodeBase';

const handles = defineHandles({

    p1: {
        dataType: DataTypeNames.Number
    },
    p2: {
        dataType: DataTypeNames.Number
    },
    [mainOutputHandleId]: {
        dataType: DataTypeNames.Number
    }
});

@registerNodeType
export class LastChangedNumber extends NodeBase<typeof handles> {
    static defNodeName = 'Last Changed Number';
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