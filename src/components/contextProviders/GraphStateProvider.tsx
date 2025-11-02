import { type Node, type Edge, ReactFlowProvider } from '@xyflow/react';
import { type FCChildren, useState } from 'react';
import { GraphStateContext } from '../../contexts/GraphStateContext';

export const GraphStateProvider: FCChildren<object> = ({ children }) => {
    const [masterNodes, setMasterNodes] = useState<Node[]>([]);
    const [masterEdges, setMasterEdges] = useState<Edge[]>([]);

    return (
        <GraphStateContext.Provider value={{ masterNodes, masterEdges, setMasterNodes, setMasterEdges }}>
            <ReactFlowProvider>
                {children}
            </ReactFlowProvider>
        </GraphStateContext.Provider>
    );
};