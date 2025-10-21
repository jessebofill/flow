import { ouputHandleId } from '../../const/const';
import { registerNodeType } from '../../const/nodeTypes';
import { defineHandles, NodeBase } from './NodeBase copy';

const handles = defineHandles({
    max: {
        id: 'max',
        dataType: 'number',
        label: 'Max'
    },
    min: {
        id: 'min',
        dataType: 'number',
        label: 'Min'
    },
    pass: {
        id: 'pass',
        dataType: 'number',
        label: 'Pass'
    },
    [ouputHandleId]: {
        dataType: 'boolean'
    }
});

@registerNodeType
export class ChanceSuccessThresh extends NodeBase<typeof handles> {
    static defNodeName = 'Chance Threshold';
    protected handleDefs = handles;
    protected isBangable = true;
    protected transform(isBang: boolean) {
        if (isBang) {
            const max = this.state.max;
            const min = this.state.min;
            const thresh = this.state.pass;
            if (min === undefined || max === undefined || thresh === undefined) return;
            return (Math.floor(Math.random() * (max - min + 1)) + min) >= thresh;
        }
    };
}