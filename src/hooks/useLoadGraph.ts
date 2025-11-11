import { useReactFlow, useViewport, type Node } from '@xyflow/react';
import { useCallback, type CSSProperties } from 'react';
import { retrieveGraph } from '../const/utils';

interface LoadGraphOptions {
    insertNodes?: Node[];
    randomizeIds?: boolean;
}

export const useLoadGraph = () => {
    const { addNodes, addEdges, fitView } = useReactFlow();
    const { x, y, zoom } = useViewport();

    return useCallback((graphId: string, options?: LoadGraphOptions) => {
        const { nodes, edges } = retrieveGraph(false, graphId, options?.randomizeIds);
        const minX = Math.min(...nodes.map(([_, node]) => node.position!.x));
        const minY = Math.min(...nodes.map(([_, node]) => node.position!.y));
        const maxX = Math.max(...nodes.map(([_, node]) => node.position!.x));
        const maxY = Math.max(...nodes.map(([_, node]) => node.position!.y));
        const pane = document.querySelector('.reactflow-wrapper')!;
        const graphWidth = maxX - minX;
        const graphHeight = maxY - minY;
        const graphCenterX = minX + graphWidth / 2;
        const graphCenterY = minY + graphHeight / 2;
        const viewportCenterX = -x / zoom + pane.clientWidth / (2 * zoom);
        const viewportCenterY = -y / zoom + pane.clientHeight / (2 * zoom);
        const randomizeX = (Math.random() - 0.5) * 100;
        const randomizeY = (Math.random() - 0.5) * 100;
        const offsetX = viewportCenterX + randomizeX - graphCenterX;
        const offsetY = viewportCenterY + randomizeY - graphCenterY;

        const rfNodes: Node[] = nodes.map(([defNodeName, props]) => {
            const { position, ...node } = props;
            return {
                type: defNodeName,
                position: { x: position!.x + offsetX, y: position!.y + offsetY },
                ...node,
                style: { visibility: 'hidden' } as CSSProperties
            };
        });
        if (options?.insertNodes) rfNodes.splice(rfNodes.length, 0, ...options.insertNodes);
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
    }, [addEdges, addNodes, fitView, x, y, zoom]);
};
