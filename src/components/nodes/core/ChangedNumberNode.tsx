import { mainOutputHandleId, seqOutHandleIdPrefix } from '../../../const/const';
import { registerNodeType } from '../../../const/nodeTypes';
import { DataTypeNames } from '../../../types/types';
import { NodeBase } from '../NodeBase';
import { defineHandles } from '../../../const/utils';

const signalOutId = `${seqOutHandleIdPrefix}signalOut`;

const handles = defineHandles({
    in: {
        dataType: DataTypeNames.Number
    },
    [mainOutputHandleId]: {
        dataType: DataTypeNames.Number
    },
    [signalOutId]: {
        dataType: DataTypeNames.Bang,
        label: 'Signal on value changed'
    }
});

@registerNodeType
export class ChangedNumberNode extends NodeBase<typeof handles> {
    static defNodeName = 'Changed Number';
    static description = 'Updates the output number value only if the input value changed. A signal is also dispatched when it does.';

    protected get handleDefs() { return handles };
    declare saveableState: { lastValue: number };

    protected setDefaults(): void {
        const defaultValue = 0;
        this.state = {
            handles: {
                in: defaultValue
            }
        };

        this.saveableState = {
            lastValue: defaultValue
        };
    }

    protected async onOutputChange(prevValue: number | undefined, nextValue: number | undefined) {
        this.saveableState.lastValue = nextValue ?? 0;
        await this.exeTargetCallbacks(signalOutId);
    }

    protected transform() {
        if (this.state.handles.in === this.saveableState.lastValue) return null;
        return Number(this.state.handles.in);
    }
}