import { type Connection, type Edge, type Node } from '@xyflow/react';
import { globalNodeInstanceRegistry } from './nodeTypes';
import { nodeCreatorNodeId } from './const';
import { appDb } from '../database';
import { ProxyNode } from '../components/nodes/core/ProxyNode';


export function getConnections(edges: Edge[], nodeId: string, handleId: string) {
    return edges.filter((edge) => edge.source === nodeId && edge.sourceHandle === handleId || edge.target === nodeId && edge.targetHandle === handleId);
}
export function getConnectedTargets(edges: Edge[], sourceNodeId: string, sourceHandleId: string) {
    return edges.filter((edge) => edge.source === sourceNodeId && edge.sourceHandle === sourceHandleId)
        .map((edge) => ({
            targetNodeId: edge.target,
            targetHandleId: edge.targetHandle,
        }));
}
export function getConnectedSources(edges: Edge[], targetNodeId: string, targetHandleId: string) {
    return edges.filter((edge) => edge.target === targetNodeId && edge.targetHandle === targetHandleId)
        .map((edge) => ({
            sourceNodeId: edge.source,
            sourceHandleId: edge.sourceHandle,
        }));
}

export function getIslands(nodes: Node[], edges: Edge[]): Node[][] {
    const visited = new Set<string>();
    const adjacency = new Map<string, Set<string>>();

    // Build adjacency map
    for (const edge of edges) {
        if (!adjacency.has(edge.source)) adjacency.set(edge.source, new Set());
        if (!adjacency.has(edge.target)) adjacency.set(edge.target, new Set());
        adjacency.get(edge.source)!.add(edge.target);
        adjacency.get(edge.target)!.add(edge.source);
    }

    const islands: Node[][] = [];

    function dfs(nodeId: string, island: Node[]) {
        visited.add(nodeId);
        const node = nodes.find(n => n.id === nodeId);
        if (node) island.push(node);
        for (const neighbor of adjacency.get(nodeId) ?? []) {
            if (!visited.has(neighbor)) dfs(neighbor, island);
        }
    }

    for (const node of nodes) {
        if (!visited.has(node.id)) {
            const island: Node[] = [];
            dfs(node.id, island);
            islands.push(island);
        }
    }

    return islands;
}

export function getIslandOfNode(nodeId: string, nodes: Node[], edges: Edge[]) {
    return getIslands(nodes, edges).find(island => island.some(n => n.id === nodeId)) ?? [];
}

export function getNodeHandleType(nodeId: string, handleId: string) {
    const instance = globalNodeInstanceRegistry.get(nodeId);
    if (!instance) throw new Error('Could not find node in the registry to get handle type');
    return instance.getHandleType(handleId);
}

export function validateConnection(connection: Connection | Edge, edges: Edge[]) {
    const { source, sourceHandle, target, targetHandle } = connection;
    if (source === target) return false;
    if (sourceHandle === null || sourceHandle === undefined) throw new Error('Source node had no hanlde id to connect to');
    if (targetHandle === null || targetHandle === undefined) throw new Error('Target node had no hanlde id to connect to');

    if (source === nodeCreatorNodeId) {
        return true;
        // const existingTargets = getConnectedTargets(edges, source, sourceHandle);
        // if (existingTargets.length <= 0) return true;
        // return getNodeHandleType(target, targetHandle) === getNodeHandleType(existingTargets[0].targetNodeId, existingTargets[0].targetHandleId!);
    } else if (target === nodeCreatorNodeId) return true;
    return getNodeHandleType(source, sourceHandle) === getNodeHandleType(target, targetHandle);
}

export async function onAppLoad() {
    await appDb.syncCache();
    //need to update react flow when this changes
    Object.entries(appDb.cache.userNodes).forEach(([typeIndentifier, values]) => {
        ProxyNode.registerUserNodeType(typeIndentifier, values.isBangable);
    });
}



