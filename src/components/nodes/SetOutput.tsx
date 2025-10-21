import { ouputHandleId } from '../../const/const';
import { registerNodeType } from '../../const/nodeTypes';
import { DataTypeNames } from '../../types/types';
import { defineHandles, NodeBase } from './NodeBase copy';

const handles = defineHandles({
    in: {
        dataType: DataTypeNames.Number,
    },
    [ouputHandleId]: {
        dataType: DataTypeNames.Number
    }
});

@registerNodeType
export class SetOutputNode extends NodeBase<typeof handles> {
    static defNodeName = 'Set Ouput';
    protected handleDefs = handles;
    protected isBangable = true;
    protected setDefaults(): void {
        this.state = {
            in: 0,
            [ouputHandleId]: 0
        };
    }

    protected transform(isBang: boolean) {
        if (isBang) {
            return this.state.in;
        }
        return null;
    }
}

