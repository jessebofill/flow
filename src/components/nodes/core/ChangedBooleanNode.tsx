import { mainOutputHandleId, seqOutHandleIdPrefix } from '../../../const/const';
import { registerNodeType } from '../../../const/nodeTypes';
import { DataTypeNames } from '../../../types/types';
import { NodeBase } from '../NodeBase';
import { defineHandles } from '../../../const/utils';

const signalOutId = `${seqOutHandleIdPrefix}signalOut`;

const handles = defineHandles({
    in: {
        dataType: DataTypeNames.Boolean
    },
    [mainOutputHandleId]: {
        dataType: DataTypeNames.Boolean
    },
    [signalOutId]: {
        dataType: DataTypeNames.Bang,
        label: 'Signal on value changed'
    }
});

@registerNodeType
export class ChangedBooleanNode extends NodeBase<typeof handles> {
    static defNodeName = 'Changed Boolean';
    protected get handleDefs() { return handles };
    declare saveableState: { lastValue: boolean };

    protected setDefaults(): void {
        const defaultValue = false;
        this.state = {
            handles: {
                in: defaultValue
            }
        };

        this.saveableState = {
            lastValue: defaultValue
        };
    }

    protected async onOutputChange(prevValue: boolean | undefined, nextValue: boolean | undefined) {
        this.saveableState.lastValue = nextValue ?? false;
        await this.exeTargetCallbacks(signalOutId);
    }

    protected transform() {
        if (this.state.handles.in === this.saveableState.lastValue) return null;
        return Boolean(this.state.handles.in);
    }
}