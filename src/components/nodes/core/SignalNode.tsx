import { seqOutHandleIdPrefix } from '../../../const/const';
import { registerNodeType } from '../../../const/nodeTypes';
import { DataTypeNames } from '../../../types/types';
import { NodeBase } from '../NodeBase';
import { defineHandles, isBangInHandleId } from '../../../const/utils';

const delayedSignalOutKey = `${seqOutHandleIdPrefix}delay`

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
    protected get handleDefs() { return handles };
    protected actionButtonText: string = 'Send';
    protected timeoutId = 0;

    protected transform(id: string | null) {
        if (!isBangInHandleId(id)) return null;

        const delay = this.state.handles.delaySec ?? 0;
        if (delay >= 0) this.timeoutId = setTimeout(() => this.exeTargetCallbacks(delayedSignalOutKey), delay * 1000);
    }
}