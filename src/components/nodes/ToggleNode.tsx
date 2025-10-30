import { mainOutputHandleId } from '../../const/const';
import { registerNodeType } from '../../const/nodeTypes';
import { DataTypeNames } from '../../types/types';
import { defineHandles, isBangInHandleId, NodeBase } from './NodeBase';

const handles = defineHandles({
    [mainOutputHandleId]: {
        dataType: DataTypeNames.Boolean
    }
})

@registerNodeType
export class ToggleNode extends NodeBase<typeof handles> {
    static defNodeName = 'Toggle';
    protected isBangable: boolean = true;
    protected handleDefs = handles;
    protected actionButtonText: string = 'Toggle';
    protected transform(id: string): boolean | null | undefined {
        if (isBangInHandleId(id)) {
            return !this.state[mainOutputHandleId];
        }
    }
}