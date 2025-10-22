import { outputHandleId } from '../../const/const';
import { registerNodeType } from '../../const/nodeTypes';
import { DataTypeNames } from '../../types/types';
import { defineHandles, NodeBase } from './NodeBase';

const handles = defineHandles({
    in: {
        dataType: DataTypeNames.Number
    },
    [outputHandleId]: {
        dataType: DataTypeNames.Number
    }
});

@registerNodeType
export class Number extends NodeBase<typeof handles> {
    static defNodeName = 'Number';
    protected handleDefs = handles;

    protected transform(): number | null | undefined {
        return this.state.in;
    }
}