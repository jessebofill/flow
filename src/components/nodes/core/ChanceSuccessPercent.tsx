import { mainOutputHandleId } from '../../../const/const';
import { registerNodeType } from '../../../const/nodeTypes';
import { DataTypeNames } from '../../../types/types';
import { NodeBase } from '../NodeBase';
import { defineHandles, isBangInHandleId } from '../../../const/utils';

const handles = defineHandles({
    percent: {
        dataType: DataTypeNames.Number,
        label: '% Chance'
    },
    [mainOutputHandleId]: {
        dataType: DataTypeNames.Boolean
    }
});

@registerNodeType
export class ChanceSuccessPercent extends NodeBase<typeof handles> {
    static defNodeName = 'Chance Percent';
    static isBangable = true;
    protected get handleDefs() { return handles };
    protected actionButtonText: string = 'Try';

    protected setDefaults(): void {
        this.state = {
            handles: {
                percent: 50
            }
        };
    }

    protected transform(id: string | null) {
        if (isBangInHandleId(id)) {
            const max = 100;
            const min = 1;
            const thresh = this.state.handles.percent;
            if (thresh === undefined) return;
            //* need to improve this algorithm
            return Math.floor(Math.random() * (max - min + 1)) + min < thresh;
        }
    };
}