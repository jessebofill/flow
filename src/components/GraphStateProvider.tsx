import type { Node, Edge } from '@xyflow/react';
import { type FCChildren, useState } from 'react';
import { GraphStateContext } from '../contexts/GraphStateContext';
import { testNodes } from '../const/testData';

export const GraphStateProvider: FCChildren<object> = ({ children }) => {
    const [nodes, setNodes] = useState<Node[]>(testNodes);
    const [edges, setEdges] = useState<Edge[]>([]);

    return (
        <GraphStateContext.Provider value={{ nodes, edges, setNodes, setEdges }}>
            {children}
        </GraphStateContext.Provider>
    );
};