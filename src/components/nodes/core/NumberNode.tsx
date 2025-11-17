import { mainOutputHandleId } from '../../../const/const';
import { registerNodeType } from '../../../const/nodeTypes';
import { DataTypeNames } from '../../../types/types';
import { NodeBase } from '../NodeBase';
import { defineHandles } from '../../../const/utils';

const handles = defineHandles({
    in: {
        dataType: DataTypeNames.Number
    },
    [mainOutputHandleId]: {
        dataType: DataTypeNames.Number
    }
});

@registerNodeType
export class NumberNode extends NodeBase<typeof handles> {
    static defNodeName = 'Number';
    protected get handleDefs() { return handles };

    protected transform(): number | null | undefined {
        return this.state.handles.in;
    }
}