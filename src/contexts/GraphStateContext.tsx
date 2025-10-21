import { createContext } from 'react';
import type { Node, Edge } from '@xyflow/react';

export interface GraphStateContextData {
    nodes: Node[];
    edges: Edge[];
    setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
    setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
};

export const GraphStateContext = createContext<GraphStateContextData>({
    nodes: [],
    edges: [],
    setNodes: () => { },
    setEdges: () => { }
});