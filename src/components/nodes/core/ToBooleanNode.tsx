import { mainOutputHandleId } from '../../../const/const';
import { registerNodeType } from '../../../const/nodeTypes';
import { DataTypeNames } from '../../../types/types';
import { NodeBase } from '../NodeBase';
import { defineHandles } from '../../../const/utils';

const handles = defineHandles({
    input: {
        dataType: DataTypeNames.Number
    },
    [mainOutputHandleId]: {
        dataType: DataTypeNames.Boolean
    }
});

@registerNodeType
export class ToBooleanNode extends NodeBase<typeof handles> {
    static defNodeName = 'To Boolean';
    static description = 'Converts a number to a boolean.';

    protected get handleDefs() { return handles };

    protected setDefaults(): void {
        this.state = {
            handles: { input: 0 }
        };
    }

    protected transform(): boolean | null | undefined {
        return Boolean(this.state.handles.input);
    }
}