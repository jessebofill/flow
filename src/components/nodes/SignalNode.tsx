import { bangOutHandleId } from '../../const/const';
import { registerNodeType } from '../../const/nodeTypes';
import { DataTypeNames } from '../../types/types';
import { defineHandles, isBangOutHandleId, NodeBase } from './NodeBase';

const handles = defineHandles({
    delaySec: {
        dataType: DataTypeNames.Number,
        label: 'Delay Sec'
    }
});

@registerNodeType
export class SignalNode extends NodeBase<typeof handles> {
    static defNodeName = 'Signal';
    protected handleDefs = handles;
    protected isBangable = true;
    protected hideIsActiveHandle = true;
    protected actionButtonText: string = 'Send';

    transform = (id: string) => {
        if (!isBangOutHandleId(id)) return null;

        const delay = this.state.delaySec;
        if (delay && delay > 0) {
            setTimeout(() => this.bangThroughHandleId(bangOutHandleId), delay * 1000);
            return null;
        }
    }
}