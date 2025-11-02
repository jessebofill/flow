import { mainOutputHandleId } from '../../../const/const';
import { registerNodeType } from '../../../const/nodeTypes';
import { DataTypeNames } from '../../../types/types';
import { defineHandles, NodeBase } from '../NodeBase';

const handles = defineHandles({
    max: {
        dataType: DataTypeNames.Number,
        label: 'Max'
    },
    min: {
        dataType: DataTypeNames.Number,
        label: 'Min'
    },
    pass: {
        dataType: DataTypeNames.Number,
        label: 'Pass'
    },
    [mainOutputHandleId]: {
        dataType: DataTypeNames.Boolean
    }
});

@registerNodeType
export class ChanceSuccessThresh extends NodeBase<typeof handles> {
    static defNodeName = 'Chance Threshold';
    static isBangable = true;
    protected handleDefs = handles;
    protected actionButtonText: string = 'Try';

    protected transform(id: string) {
        if (this.isBangOutputHandle(id)) {
            const max = this.state.max;
            const min = this.state.min;
            const thresh = this.state.pass;
            if (min === undefined || max === undefined || thresh === undefined) return;
            return (Math.floor(Math.random() * (max - min + 1)) + min) >= thresh;
        }
    };
}