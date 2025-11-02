import { mainOutputHandleId, variOutHandleIdPrefix } from '../../../const/const';
import { registerNodeType } from '../../../const/nodeTypes';
import { DataTypeNames } from '../../../types/types';
import { defineHandles, NodeBase } from '../NodeBase';

const handles = defineHandles({
    in: {
        dataType: DataTypeNames.Number
    },
    [mainOutputHandleId]: {
        dataType: DataTypeNames.Number
    },
    [`${variOutHandleIdPrefix}a`]: {
        dataType: DataTypeNames.Number
    },
    [`${variOutHandleIdPrefix}sdfsd`]: {
        dataType: DataTypeNames.Boolean
    },
    [`${variOutHandleIdPrefix}b`]: {
        dataType: DataTypeNames.Bang
    },
    [`${variOutHandleIdPrefix}c`]: {
        dataType: DataTypeNames.Boolean
    }
});

@registerNodeType
export class NumberNode extends NodeBase<typeof handles> {
    static defNodeName = 'Atets';
    protected handleDefs = handles;

    protected transform(): number | null | undefined {
        return this.state.in;
    }
}