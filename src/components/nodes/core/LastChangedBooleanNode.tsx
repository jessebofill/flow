import { mainOutputHandleId, variadicInHandleIdPrefix } from '../../../const/const';
import { registerNodeType } from '../../../const/nodeTypes';
import { DataTypeNames } from '../../../types/types';
import { NodeBase, type InputHandleId } from '../NodeBase';
import { defineHandles } from '../../../const/utils';

const varaiadicOperandId = `${variadicInHandleIdPrefix}operand`;

const handles = defineHandles({
    [varaiadicOperandId]: {
        dataType: DataTypeNames.Boolean,
    },
    [mainOutputHandleId]: {
        dataType: DataTypeNames.Boolean
    }
});

@registerNodeType
export class LastChangedBoolean extends NodeBase<typeof handles> {
    static defNodeName = 'Last Changed Boolean';
    protected get handleDefs() { return handles };

    protected setDefaults(): void {
        this.variadicHandleDefaults = {
                [varaiadicOperandId]: false
        };
    }

    protected transform(id: InputHandleId<typeof this.handleDefs> | null) {
        if (id === null) return null;
        return this.state.handles[id];
    }
}