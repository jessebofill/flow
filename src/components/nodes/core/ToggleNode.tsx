import { mainOutputHandleId } from '../../../const/const';
import { registerNodeType } from '../../../const/nodeTypes';
import { DataTypeNames } from '../../../types/types';
import { NodeBase } from '../NodeBase';
import { defineHandles, isBangInHandleId } from '../../../const/utils';

const handles = defineHandles({
    [mainOutputHandleId]: {
        dataType: DataTypeNames.Boolean
    }
})

@registerNodeType
export class ToggleNode extends NodeBase<typeof handles> {
    static defNodeName = 'Toggle';
    static isBangable: boolean = true;
    static description = 'Inverts the output boolean value.';

    protected get handleDefs() { return handles };
    protected actionButtonText: string = 'Toggle';

    protected setDefaults(): void {
        this.state = {
            handles: {
                [mainOutputHandleId]: false
            }
        };
    }

    protected transform(id: string | null): boolean | null | undefined {
        if (isBangInHandleId(id)) {
            return !this.state.handles[mainOutputHandleId];
        }
    }
}