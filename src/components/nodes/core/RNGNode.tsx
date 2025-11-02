import { registerNodeType } from '../../../const/nodeTypes';
import { defineHandles, isBangInHandleId, NodeBase } from '../NodeBase';
import { mainOutputHandleId } from '../../../const/const';
import { DataTypeNames } from '../../../types/types';
const handles = defineHandles({
    max: {
        dataType: DataTypeNames.Number,
        label: 'Max'
    },
    min: {
        dataType: DataTypeNames.Number,
        label: 'Min'
    },
    [mainOutputHandleId]: {
        dataType: DataTypeNames.Number

    }
});

@registerNodeType
export class RNGNode extends NodeBase<typeof handles> {
    static defNodeName = 'RNG'
    static isBangable: boolean = true;
    protected handleDefs = handles;
    protected actionButtonText: string = 'Generate';
    protected setDefaults(): void {
        this.state = {
            min: 1,
            max: 10
        };
    }

    protected transform(id: string) {
        if (isBangInHandleId(id)) {
            const max = this.state.max;
            const min = this.state.min;
            if (min === undefined || max === undefined) return;
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }
        return null;
    };
}