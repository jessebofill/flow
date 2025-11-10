import { type Node, type NodeProps, type XYPosition } from '@xyflow/react';
import type { HandleDefs, NodeClass } from '../types/types';
import { v4 as uuid } from 'uuid';
import type { CustomNodeDataProps, NodeBase } from '../components/nodes/NodeBase';
import { appDb, type CreatedNode, type SavedGraph } from '../database';
import { nodeCreatorTypeName } from './const';
import { NodeCreator } from '../components/nodes/NodeCreator';
import type { ComponentType } from 'react';
import { ProxyNode } from '../components/nodes/core/ProxyNode';
import { toast } from 'sonner';
import { Tags } from './tags';
import { EventNotifier, Events } from '../EventNotifier';
import { getGraphsAndNodesWithDep, updateGraphDepIdentifier } from './utils';

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
    const nodeId = uuid();
    return {
        id: nodeId,
        position: pos ?? { x: 0, y: 0 },
        data: {
            nodeInstanceRegistry: globalNodeInstanceRegistry,
            isVirtual: false,
            isInSubGraph: false
        },
        type: rfIdentifier,
        style: { visibility: 'hidden', opacity: 0 }
    }
}

export async function deleteUserNode(rfTypeIdentifier: string) {
    delete coreNodeTypes[rfTypeIdentifier];
    EventNotifier.dispatch(Events.UpdateNodeTypes);
    await appDb.removeUserNode(rfTypeIdentifier);
}

export function saveUserNode(rfTypeIdentifier: string, node: CreatedNode, graph: SavedGraph, isUpdate?: boolean | { originalIdentifier: string }) {
    const writes = Promise.all([
        appDb.putUserNode(rfTypeIdentifier, node),
        appDb.putGraph(node.graphId, graph)
    ]);

    writes.then(() => {
        toast.success(`Node "${rfTypeIdentifier}" saved to the database.`);
    }).catch((e) => {
        toast.error(`Node "${rfTypeIdentifier}" failed to be saved to the databased.\n${e}}`);
    });

    return ProxyNode.registerUserNodeType(rfTypeIdentifier, node.isBangable);
}

export async function updateUserNode(rfTypeIdentifier: string, node: CreatedNode, graph: SavedGraph, oldIdentifier?: string) {
    if (oldIdentifier) {
        let renameFail = false;
        const { nonNodeGraphsWithDep, nodesWithDep } = getGraphsAndNodesWithDep(oldIdentifier);
        nodesWithDep.forEach(nodeId => {
            if (renameFail) return;
            const graphId = appDb.cache.userNodes[nodeId].graphId;
            try {
                updateGraphDepIdentifier(graphId, oldIdentifier, rfTypeIdentifier);
            } catch {
                renameFail = true;
                toast.error(`Failed to apply name changes to internal graph of node "${nodeId}". Database may be corrupted`);
            }
        });
        nonNodeGraphsWithDep.forEach(graphId => {
            if (renameFail) return;
            try {
                updateGraphDepIdentifier(graphId, oldIdentifier, rfTypeIdentifier);
            } catch {
                renameFail = true;
                toast.error(`Failed to apply name changes to saved graph "${graphId}". Database may be corrupted`);
            }
        });

        if (renameFail) {
            toast.error(`Node updates for "${oldIdentifier}" -> "${rfTypeIdentifier} were not saved to the database due to rename failure.}`)
        }
        await deleteUserNode(oldIdentifier);
    }

    const writes = Promise.all([
        appDb.putUserNode(rfTypeIdentifier, node),
        appDb.putGraph(node.graphId, graph)
    ]);

    try {
        await writes;
        toast.success(`Node "${oldIdentifier ?? rfTypeIdentifier}" updated ${oldIdentifier ? `and renamed to "${rfTypeIdentifier}" ` : ''}in the database.`);
    } catch (e) {
        toast.error(`Node "${rfTypeIdentifier}" failed to be updated in the databased.\n${e}}`);
    };

    if (oldIdentifier) {
        ProxyNode.registerUserNodeType(rfTypeIdentifier, node.isBangable);
        EventNotifier.dispatch(Events.UpdateNodeTypes);
    }
}