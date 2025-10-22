import { registerNodeType } from '../../const/nodeTypes';
import { DataTypeNames } from '../../types/types';
import { defineHandles, isBangOutHandleId, NodeBase } from './NodeBase';

const handles = defineHandles({
    delaySec: {
        dataType: DataTypeNames.Number,
        label: 'Delay Sec'
    },
    delayedSignal: {
        dataType: DataTypeNames.Bang,
        label: 'Delayed Signal'
    }
});

@registerNodeType
export class SignalNode extends NodeBase<typeof handles> {
    static defNodeName = 'Signal';
    protected handleDefs = handles;
    protected isBangable = true;
    protected actionButtonText: string = 'Send';
    protected timeoutId = 0;

    transform = (id: string) => {
        if (!isBangOutHandleId(id)) return null;

        const delay = this.state.delaySec ?? 0;
        if (delay >= 0) this.timeoutId = setTimeout(() => this.bangThroughHandleId(this.getExtraBangoutIds()[0]), delay * 1000);
    }
}