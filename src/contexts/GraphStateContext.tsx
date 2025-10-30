import { createContext } from 'react';
import type { Node, Edge } from '@xyflow/react';

export interface GraphStateContextData {
    masterNodes: Node[];
    masterEdges: Edge[];
    setMasterNodes: React.Dispatch<React.SetStateAction<Node[]>>;
    setMasterEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
};

export const GraphStateContext = createContext<GraphStateContextData>({
    masterNodes: [],
    masterEdges: [],
    setMasterNodes: () => { },
    setMasterEdges: () => { }
});