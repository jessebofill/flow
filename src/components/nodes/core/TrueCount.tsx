import { mainOutputHandleId, variadicInHandleIdPrefix } from '../../../const/const';
import { registerNodeType } from '../../../const/nodeTypes';
import { DataTypeNames } from '../../../types/types';
import { NodeBase } from '../NodeBase';
import { defineHandles } from '../../../const/utils';

const varaiadicOperandId = `${variadicInHandleIdPrefix}input`;

const handles = defineHandles({
    [varaiadicOperandId]: {
        dataType: DataTypeNames.Boolean,
    },
    [mainOutputHandleId]: {
        dataType: DataTypeNames.Number
    }
});

@registerNodeType
export class TrueCount extends NodeBase<typeof handles> {
    static defNodeName = 'True Count';
    protected get handleDefs() { return handles };

    protected setDefaults(): void {
        this.state = {
            handles: { [mainOutputHandleId]: 0 }
        }
        this.variadicHandleDefaults = {
            [varaiadicOperandId]: false
        }
    }

    protected transform() {
        const operands = Object.entries(this.state.handles).filter(([key]) => key.startsWith(varaiadicOperandId)).map(([_, value]) => value);
        return operands.reduce<number>((acc, val) => val === true ? acc + 1 : acc, 0);
    }
}

