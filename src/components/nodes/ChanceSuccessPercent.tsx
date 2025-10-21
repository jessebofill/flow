import { outputHandleId } from '../../const/const';
import { registerNodeType } from '../../const/nodeTypes';
import { defineHandles, isBangOutHandleId, NodeBase } from './NodeBase';

const handles = defineHandles({
    percent: {
        id: 'percent',
        dataType: 'number',
        label: '% Chance'
    },
    [outputHandleId]: {
        dataType: 'boolean'
    }
});

@registerNodeType
export class ChanceSuccessPercent extends NodeBase<typeof handles> {
    static defNodeName = 'Chance Percent';
    protected handleDefs = handles;
    protected isBangable = true;

    protected setDefaults(): void {
        this.state = {
            percent: 50
        };
    }

    protected transform(id: string) {
        if (isBangOutHandleId(id)) {
            const max = 100;
            const min = 0;
            const thresh = this.state.percent;
            if (thresh === undefined) return;
            return Math.floor(Math.random() * (max - min + 1)) + min >= thresh;
        }
    };
}