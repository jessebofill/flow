import { type Node, type NodeProps, type XYPosition } from '@xyflow/react';
import type { HandleDefs, NodeClass } from '../types/types';
import { v4 as uuidv4 } from 'uuid';
import type { CustomNodeDataProps, NodeBase } from '../components/nodes/NodeBase';
import { appDb, type Graph, type GraphState } from '../database';
import { nodeCreatorTypeName } from './const';
import { NodeCreator } from '../components/nodes/NodeCreator';
import type { ComponentType } from 'react';
import { ProxyNode } from '../components/nodes/core/ProxyNode';
import { toast } from 'sonner';
import { Tags } from './tags';
import { EventNotifier, Events } from '../EventNotifier';

export type NodeInstanceRegistry = Map<string, NodeBase<HandleDefs>>;

export const coreNodeTypes: {
    [rfIdentifier: string]: NodeClass,
} = {};

export const otherNodeTypes: Record<string, ComponentType<NodeProps>> = {
    [nodeCreatorTypeName]: NodeCreator
}

export const allNodeTypes = combineNodeTypes(coreNodeTypes, otherNodeTypes);
export const globalNodeInstanceRegistry: NodeInstanceRegistry = new Map<string, NodeBase<HandleDefs>>();
//@ts-ignore
window.reg2 = globalNodeInstanceRegistry

window.nodes = coreNodeTypes

function combineNodeTypes(...targets: Record<string, Function>[]) {
    return new Proxy({}, {
        get(_, prop) {
            for (const target of targets) {
                if (typeof prop === 'string' && prop in target) return target[prop];
            }
        },
        has(_, prop) {
            return targets.some(t => prop in t);
        },
        ownKeys() {
            return [...new Set(targets.flatMap(Object.keys))];
        },
        getOwnPropertyDescriptor(_, prop) {
            for (const target of targets) {
                const desc = Object.getOwnPropertyDescriptor(target, prop);
                if (desc) return desc;
            }
        }
    }) as Record<string, ComponentType<NodeProps>>;
}

export function registerNodeType<T extends NodeClass>(nodeClass: T, isUserNode?: boolean) {
    if (typeof nodeClass.defNodeName !== 'string') throw new Error(`Missing static defNodeName on node class '${nodeClass.name}'`);
    if (coreNodeTypes[nodeClass.defNodeName]) throw new Error(`Duplicate identifier '${nodeClass.defNodeName}' found in node type map`);
    coreNodeTypes[nodeClass.defNodeName] = nodeClass;
    if (!nodeClass.tags) nodeClass.tags = [];
    nodeClass.tags.push(Tags.All);
    if (nodeClass.isBangable) nodeClass.tags.push(Tags.Action);
    else nodeClass.tags.push(Tags.NotAction);
    if (isUserNode) nodeClass.tags.push(Tags.User);
    EventNotifier.dispatch(Events.UpdateNodeTypes);
}

export function createNodeFromClassDef(NodeClass: NodeClass, pos?: XYPosition): Node<CustomNodeDataProps> {
    const res = Object.entries(coreNodeTypes).find(([_, nodeClass]) => nodeClass === NodeClass);
    if (!res) throw new Error('Could not find class instance in node types')
    const [rfIdentifier, ClassDef] = res;
    const nodeId = uuidv4();
    return {
        id: nodeId,
        position: pos ?? { x: 0, y: 0 },
        data: {
            nodeInstanceRegistry: globalNodeInstanceRegistry,
            isVirtual: false
        },
        type: rfIdentifier,
        style: { visibility: 'hidden', opacity: 0 }
    }
}

export function saveUserNode(rfTypeIdentifier: string, isBangable: boolean, handleDefs: HandleDefs, graphId: string, graph: Graph, graphState: GraphState, actionLabel?: string) {
    const writes = Promise.all([
        appDb.putUserNode(rfTypeIdentifier, { graphId, handleDefs, isBangable, actionLabel }),
        appDb.putGraphState(graphId, graphState),
        appDb.putGraph(graphId, graph)
    ]);

    writes.then(() => {
        toast.success(`Node "${rfTypeIdentifier}" saved to the database.`);
    }).catch((e) => {
        toast.error(`Node "${rfTypeIdentifier}" failed to be saved to the databased.\n${e}}`);
    });
    return ProxyNode.registerUserNodeType(rfTypeIdentifier, isBangable);
}