import { mainOutputHandleId, variadicInHandleIdPrefix } from '../../../const/const';
import { registerNodeType } from '../../../const/nodeTypes';
import { DataTypeNames } from '../../../types/types';
import { NodeBase, type InputHandleId } from '../NodeBase';
import { defineHandles } from '../../../const/utils';

const varaiadicOperandId = `${variadicInHandleIdPrefix}operand`;

const handles = defineHandles({
    [varaiadicOperandId]: {
        dataType: DataTypeNames.Number,
    },
    [mainOutputHandleId]: {
        dataType: DataTypeNames.Number
    }
});

@registerNodeType
export class LastChangedNumber extends NodeBase<typeof handles> {
    static defNodeName = 'Last Changed Number';
    protected get handleDefs() { return handles };

    protected setDefaults(): void {
        this.variadicHandleDefaults = {
            [varaiadicOperandId]: 0
        };
    }

    protected transform(id: InputHandleId<typeof this.handleDefs> | null) {
        if (id === null) return null;
        return this.state.handles[id];
    }
}