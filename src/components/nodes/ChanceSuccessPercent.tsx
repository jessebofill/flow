import { ouputHandleId } from '../../const/const';
import { registerNodeType } from '../../const/nodeTypes';
import { defineHandles, NodeBase } from './NodeBase copy';

const handles = defineHandles({
    percent: {
        id: 'percent',
        dataType: 'number',
        label: '% Chance'
    },
    [ouputHandleId]: {
        dataType: 'boolean'
    }
});

@registerNodeType
export class ChanceSuccessPercent extends NodeBase<typeof handles> {
    static defNodeName = 'Chance Percent';
    protected handleDefs = handles;
    protected isBangable = true;
    protected transform(isBang: boolean) {
        if (isBang) {
            const max = this.state.max;
            const min = this.state.min;
            if (min === undefined || max === undefined) return;
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }
    };
}