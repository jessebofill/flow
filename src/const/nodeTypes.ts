import type { Node, XYPosition } from '@xyflow/react';
import type { NodeClass } from '../types/types';
import { v4 as uuidv4 } from 'uuid';

export const nodeTypes: { [rfIdentifier: string]: NodeClass } = {
    // bang: BangNode,
    // // rng: RNGNode,
    // chanceThresh: ChanceSuccessThresh
}

window.nodes = nodeTypes
export function registerNodeType<T extends NodeClass>(nodeClass: T) {
    if (nodeTypes[nodeClass.defNodeName]) throw new Error(`Duplicate identifier '${nodeClass.defNodeName}' found in node type map`);
    nodeTypes[nodeClass.defNodeName] = nodeClass;
}

export function createNodeFromClassDef(NodeClass: NodeClass, pos?: XYPosition): Node {
    const res = Object.entries(nodeTypes).find(([_, nodeClass]) => nodeClass === NodeClass);
    if (!res) throw new Error('Could not find class instance in node types')
    const [rfIdentifier, ClassDef] = res;
    const nodeId = uuidv4();
    return {
        id: nodeId,
        position: pos ?? { x: 0, y: 0 },
        data: { label: ClassDef.defNodeName },
        type: rfIdentifier,
        style: { visibility: 'hidden' }
    }
}