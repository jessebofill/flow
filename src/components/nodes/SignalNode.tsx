import { variOutHandleIdPrefix } from '../../const/const';
import { registerNodeType } from '../../const/nodeTypes';
import { DataTypeNames } from '../../types/types';
import { defineHandles, isBangInHandleId, NodeBase } from './NodeBase';

const delayedSignalOutKey = `${variOutHandleIdPrefix}delay`

const handles = defineHandles({
    delaySec: {
        dataType: DataTypeNames.Number,
        label: 'Delay Sec'
    },
    [delayedSignalOutKey]: {
        dataType: DataTypeNames.Bang,
        label: 'Delayed Signal'
    }
});

@registerNodeType
export class SignalNode extends NodeBase<typeof handles> {
    static defNodeName = 'Signal';
    static isBangable = true;
    protected handleDefs = handles;
    protected actionButtonText: string = 'Send';
    protected timeoutId = 0;

    transform = (id: string) => {
        if (!isBangInHandleId(id)) return null;

        const delay = this.state.delaySec ?? 0;
        if (delay >= 0) this.timeoutId = setTimeout(() => this.exeTargetCallbacks(delayedSignalOutKey), delay * 1000);
    }
}