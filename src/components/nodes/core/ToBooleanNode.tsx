import { mainOutputHandleId } from '../../../const/const';
import { registerNodeType } from '../../../const/nodeTypes';
import { DataTypeNames } from '../../../types/types';
import { defineHandles, NodeBase } from '../NodeBase';

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
    protected handleDefs = handles;

    protected setDefaults(): void {
        this.state = {
            input: 0
        };
    }

    protected transform(): boolean | null | undefined {
        return Boolean(this.state.input);
    }
}