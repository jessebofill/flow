import { outputHandleId } from '../../const/const';
import { registerNodeType } from '../../const/nodeTypes';
import { DataTypeNames } from '../../types/types';
import { defineHandles, NodeBase } from './NodeBase';

const handles = defineHandles({
    input: {
        dataType: DataTypeNames.Boolean
    },
    [outputHandleId]: {
        dataType: DataTypeNames.Number
    }
});

@registerNodeType
export class ToNumberNode extends NodeBase<typeof handles> {
    static defNodeName = 'To Number';
    protected handleDefs = handles;

    protected setDefaults(): void {
        this.state = {
            input: false
        };
    }

    protected transform(): number | null | undefined {
        return Number(this.state.input);
    }
}