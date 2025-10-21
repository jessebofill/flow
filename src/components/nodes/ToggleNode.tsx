import { outputHandleId } from '../../const/const';
import { registerNodeType } from '../../const/nodeTypes';
import { DataTypeNames } from '../../types/types';
import { defineHandles, isBangOutHandleId, NodeBase } from './NodeBase copy';

const handles = defineHandles({
    [outputHandleId]: {
        dataType: DataTypeNames.Boolean
    }
})

@registerNodeType
export class ToggleNode extends NodeBase<typeof handles> {
    static defNodeName = 'Toggle';
    protected isBangable: boolean = true;
    protected handleDefs = handles;
    protected transform(id: string): boolean | null | undefined {
        if (isBangOutHandleId(id)) {
            return !this.state[outputHandleId];
        }
    }
}