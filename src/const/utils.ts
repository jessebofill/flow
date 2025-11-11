import { type Connection, type Edge, type Node } from '@xyflow/react';
import { globalNodeInstanceRegistry, type NodeInstanceRegistry } from './nodeTypes';
import { bangInHandleId, nodeCreatorNodeId } from './const';
import { appDb, type SavedNodeState } from '../database';
import { ProxyNode } from '../components/nodes/core/ProxyNode';
import { DataTypeNames, type HandleDefs } from '../types/types';
import type { GraphSnapshot, NodeBase, NodeBaseProps } from '../components/nodes/NodeBase';
import { v4 as uuid } from 'uuid';

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

export function retrieveGraph(isVirtual: boolean, graphId: string, randomizeIds?: boolean, replaceParentId?: string, replaceState?: Record<string, SavedNodeState>) {
    const graph = appDb.cache.graphs[graphId];
    if (!graph) throw new Error(`Graph ${graphId} was not found in the database cache`);
    const nodeInstanceRegistry: NodeInstanceRegistry = isVirtual ? new Map<string, NodeBase<HandleDefs>>() : globalNodeInstanceRegistry;

    const replaceNodeId = (prevId: string, newId: string, edge: { target: string, source: string }) => {
        if (edge.target === prevId) edge.target = newId;
        if (edge.source === prevId) edge.source = newId;
    }
    const edges = graph.edges.map(edge => {
        const newEdge = { ...edge };
        if (randomizeIds) newEdge.id = uuid();
        if (replaceParentId) replaceNodeId(nodeCreatorNodeId, replaceParentId, newEdge);
        return newEdge;
    })

    const nodes = Object.entries(graph.nodes).map(([nodeId, nodeData]) => {
        const id = randomizeIds ? uuid() : nodeId;
        const overrideState = replaceState && replaceState[nodeId];
        if (randomizeIds) edges.forEach(edge => replaceNodeId(nodeId, id, edge));
        const graphSnapshot: GraphSnapshot = { ...structuredClone(overrideState ?? nodeData.initState), edges };
        const props: NodeBaseProps = {
            id,
            data: {
                nodeInstanceRegistry,
                graphSnapshot,
                isVirtual,
                isInSubGraph: true
            }
        };
        if (!isVirtual) props.position = nodeData.position;
        return [nodeData.defNodeName, props] as const;
    });

    return { nodeInstanceRegistry, edges, nodes };
}

export function getGraphsAndNodesWithDep(rfTypeIdentifier: string) {
    const graphsWithDep = Object.entries(appDb.cache.graphs)
        .filter(([_, graph]) => Object.values(graph.nodes).some(node => node.defNodeName === rfTypeIdentifier))
        .map(([graphId]) => graphId);
    const nodesEntriesWithDep = Object.entries(appDb.cache.userNodes)
        .filter(([_, createdNode]) => graphsWithDep.includes(createdNode.graphId));
    const nodesWithDep = nodesEntriesWithDep.map(([nodeKey]) => nodeKey);
    const nonNodeGraphsWithDep: string[] = [];
    const nodeGraphsWithDep: string[] = [];
    graphsWithDep.forEach(graphId => nodesEntriesWithDep.some(([_, node]) => node.graphId === graphId) ?
        nodeGraphsWithDep.push(graphId) : nodeGraphsWithDep.push(graphId));
    return { allGraphsWithDep: graphsWithDep, nodeGraphsWithDep, nonNodeGraphsWithDep, nodesWithDep };
}

export function nodeContainsNestedDep(nodeToCheckIdentifier: string, depIdentifier: string): boolean {
    const userNode = appDb.cache.userNodes[nodeToCheckIdentifier];
    if (!userNode) return false;
    const graph = appDb.cache.graphs[userNode.graphId];
    const containedTypes = Object.values(graph.nodes).map(node => node.defNodeName);
    return containedTypes.includes(depIdentifier) || containedTypes.some(typeIndentifier => nodeContainsNestedDep(typeIndentifier, depIdentifier));
}

export async function updateGraphDepIdentifier(graphId: string, oldIdentifier: string, newIdentifier: string) {
    const graph = appDb.cache.graphs[graphId];
    Object.values(graph.nodes).forEach(node => {
        if (node.defNodeName === oldIdentifier) node.defNodeName = newIdentifier;
    });

    await appDb.putGraph(graphId, graph);
}

