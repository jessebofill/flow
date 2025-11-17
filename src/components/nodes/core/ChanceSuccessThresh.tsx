import { mainOutputHandleId } from '../../../const/const';
import { registerNodeType } from '../../../const/nodeTypes';
import { DataTypeNames } from '../../../types/types';
import { NodeBase } from '../NodeBase';
import { defineHandles, isBangInHandleId } from '../../../const/utils';

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
    protected get handleDefs() { return handles };
    protected actionButtonText: string = 'Try';

    protected transform(id: string | null) {
        if (isBangInHandleId(id)) {
            const max = this.state.handles.max;
            const min = this.state.handles.min;
            const thresh = this.state.handles.pass;
            if (min === undefined || max === undefined || thresh === undefined) return;
            return (Math.floor(Math.random() * (max - min + 1)) + min) >= thresh;
        }
    };
}