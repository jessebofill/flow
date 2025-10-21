import { ouputHandleId } from '../../const/const';
import { registerNodeType } from '../../const/nodeTypes';
import { defineHandles, NodeBase } from './NodeBase copy';

const handles = defineHandles({

    p1: {
        dataType: 'number'
    },
    p2: {
        dataType: 'number'
    },
    [ouputHandleId]: {
        dataType: 'number'
    }
});

@registerNodeType
export class LastChanged extends NodeBase<typeof handles> {
    static defNodeName = 'Last Changed';
    protected handleDefs = handles;
    prevVals: { p1: number; p2: number } = { p1: 0, p2: 0 };

    protected setDefaults(): void {
        this.state = {
            p1: 0,
            p2: 0
        };
    }

    protected transform() {
        const lastChangedId = this.getInputIds().find(id => this.state[id] !== this.prevVals[id]);

        console.log('last', this.prevVals[lastChangedId], this.state[lastChangedId])
        this.prevVals[lastChangedId] = this.state[lastChangedId];
        return this.state[lastChangedId]
    }
}