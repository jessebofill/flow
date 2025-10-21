import type { Edge } from '@xyflow/react';


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


