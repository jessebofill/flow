import { mainOutputHandleId } from '../../../const/const';
import { registerNodeType } from '../../../const/nodeTypes';
import { DataTypeNames } from '../../../types/types';
import { NodeBase } from '../NodeBase';
import { defineHandles } from '../../../const/utils';

const handles = defineHandles({
    input: {
        dataType: DataTypeNames.Boolean
    },
    [mainOutputHandleId]: {
        dataType: DataTypeNames.Number
    }
});

@registerNodeType
export class ToNumberNode extends NodeBase<typeof handles> {
    static defNodeName = 'To Number';
    protected get handleDefs() { return handles };

    protected setDefaults(): void {
        this.state = {
            handles: { input: false }
        };
    }

    protected transform(): number | null | undefined {
        return Number(this.state.handles.input);
    }
}