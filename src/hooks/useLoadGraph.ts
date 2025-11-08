import { useReactFlow, type Node } from '@xyflow/react';
import { useCallback, type CSSProperties } from 'react';
import { retrieveGraph } from '../const/utils';

export const useLoadGraph = () => {
    const { addNodes, addEdges, fitView } = useReactFlow();
    return useCallback((graphId: string, insertNodes: Node) => {

        const { nodes, edges } = retrieveGraph(false, graphId);
        const rfNodes: Node[] = nodes.map(([defNodeName, props]) => {
            const { position, ...node } = props;
            return {
                type: defNodeName,
                position: position!,
                ...node,
                style: { visibility: 'hidden' } as CSSProperties
            };
        });
        if (insertNodes) rfNodes.push(insertNodes);
        addNodes(rfNodes);
        addEdges(edges);
        setTimeout(() => fitView({
            maxZoom: 1.1,
            minZoom: 0.5,
            padding: 0.3,
            duration: 500,
            ease: t => t * (2 - t),
            interpolate: 'smooth',
        }), 300);
    }, [addEdges, addNodes, fitView]);
};
