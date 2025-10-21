import { type Edge, type Node, ReactFlow } from '@xyflow/react';
import dagre from 'dagre';
import type { FC } from 'react';

const NODE_WIDTH = 300;
const NODE_HEIGHT = 275;


export function getNonOverlappingPosition(existingNodes: Node[], width = NODE_WIDTH, height = NODE_HEIGHT): { x: number; y: number } {
    const padding = 20;
    const maxX = window.innerWidth - width - padding;
    const maxY = window.innerHeight - height - padding;

    for (let y = padding; y < maxY; y += height + padding) {
        for (let x = padding; x < maxX; x += width + padding) {
            const overlaps = existingNodes.some((node) => {
                const dx = Math.abs(node.position.x - x);
                const dy = Math.abs(node.position.y - y);
                return dx < width && dy < height;
            });
            if (!overlaps) return { x, y };
        }
    }

    return { x: padding, y: maxY }; // fallback
}


export const createGraphLayout = (elements: Node[], edges: Edge[]) => {
    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: 'LR' });

    g.setDefaultEdgeLabel(() => ({}));

    elements.forEach((element) => {
        console.log('eleee', element.measured)
        g.setNode(element.id, {
            label: element.id,
            width: element.measured?.width ?? 500,
            height: element.measured?.height ?? 500,
        });
    });

    edges.forEach(e => g.setEdge(e.source, e.target))

    dagre.layout(g);

    return {
        edges: elements.map((element) => {
            const node = g.node(element.id);
            console.log('dagre node', node)
            return {
                ...element,
                position: {
                    x: node.x - node.width / 2,
                    y: node.y - node.height / 2,
                },
            };
        })

    };
};

// const NodeDebug: FC = () => {
//     const elements = useStoreState(
//         (state) => [...state.nodes, ...state.edges],
//         _.isEqual
//     );

//     const setElements = useStoreActions((actions) => actions.setElements);
//     useEffect(() => {
//         if (elements.length) {
//             const newElements = createGraphLayout(elements);
//             setElements(newElements);
//         }
//     }, [elements]);
//     return null;
// };

const Graph: FC<object> = () => {
    return (
        <ReactFlow></ReactFlow>
    );
};
