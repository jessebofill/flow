import { type Connection, type Edge, type Node } from '@xyflow/react';
import { globalNodeInstanceRegistry, type NodeInstanceRegistry } from './nodeTypes';
import { bangInHandleId, nodeCreatorNodeId } from './const';
import { appDb } from '../database';
import { ProxyNode } from '../components/nodes/core/ProxyNode';
import { DataTypeNames, type HandleDefs } from '../types/types';
import type { GraphSnapshot, NodeBase, NodeBaseProps } from '../components/nodes/NodeBase';

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
        if (sourceHandle === bangInHandleId) return getNodeHandleType(target, targetHandle) === DataTypeNames.Bang;
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

export function retrieveGraph(isVirtual: boolean, graphId: string, graphStateId: string, replaceParentId?: string) {
    const stateId = graphStateId || graphId;
    const graph = appDb.cache.graphs[graphId];
    const graphState = appDb.cache.graphStates[stateId];
    if (!graph) throw new Error(`Graph ${graphId} was not found in the database cache`);
    if (!graphState) throw new Error(`Graph state ${stateId} was not found in the database cache`);
    const nodeInstanceRegistry: NodeInstanceRegistry = new Map<string, NodeBase<HandleDefs>>();
    const edges = graph.edges.map(edge => {
        const newEdge = { ...edge };
        if (replaceParentId && newEdge.target === nodeCreatorNodeId) newEdge.target = replaceParentId;
        if (replaceParentId && newEdge.source === nodeCreatorNodeId) newEdge.source = replaceParentId;
        return newEdge;
    })

    const nodes = Object.entries(graphState.nodes).map(([nodeId, nodeData]) => {
        const graphSnapshot: GraphSnapshot = { ...nodeData.initState, edges };
        const props: NodeBaseProps = {
            id: nodeId,
            data: {
                nodeInstanceRegistry,
                graphSnapshot,
                isVirtual
            }
        };
        if (!isVirtual) props.position = nodeData.position ?? { x: 0, y: 0 };
        return [nodeData.defNodeName, props] as const;
    });

    return { nodeInstanceRegistry, edges, nodes };
}


