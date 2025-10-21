import { registerNodeType } from '../../const/nodeTypes';
import { defineHandles, NodeBase } from './NodeBase copy';
import { ouputHandleId } from '../../const/const';
const handles = defineHandles({
    max: {
        dataType: 'number',
        label: 'Max'
    },
    min: {
        dataType: 'number',
        label: 'Min'
    },
    [ouputHandleId]: {
        dataType: 'number'

    }
});

@registerNodeType
export class RNGNode extends NodeBase<typeof handles> {
    static defNodeName = 'RNG'
    protected handleDefs = handles;
    protected isBangable: boolean = true;
    protected setDefaults(): void {
        this.state = {
            min: 1,
            max: 10
        };
    }

    protected transform(isBang: boolean) {
        if (isBang) {
            const max = this.state.max;
            const min = this.state.min;
            if (min === undefined || max === undefined) return;
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }
        return null
    };
}