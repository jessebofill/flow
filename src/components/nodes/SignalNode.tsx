import { registerNodeType } from '../../const/nodeTypes';
import { defineHandles, NodeBase } from './NodeBase';

const handles = defineHandles({});

@registerNodeType
export class BangNode extends NodeBase<typeof handles> {
    static defNodeName = 'Signal';
    protected handleDefs = handles;
    protected isBangable = true;
    protected bangIfOutputNull = true;
    protected hideIsActiveHandle = true;
    protected actionButtonText: string = 'Send';
    transform = () => { };
}