import { registerNodeType } from '../../const/nodeTypes';
import { defineHandles, NodeBase } from './NodeBase';

const handles = defineHandles({});

@registerNodeType
export class BangNode extends NodeBase<typeof handles> {
    static defNodeName = 'Bang';
    protected handleDefs = handles;
    protected isBangable = true;
    protected bangIfOutputNull = true;
    protected hideIsActiveHandle = true;
    transform = () => { };
}