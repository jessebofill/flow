import { useState, type FCChildren } from 'react';
import { NodeListContext } from '../../contexts/NodeListContext';
import { coreNodeTypes } from '../../const/nodeTypes';

export const NodeListProvider: FCChildren<object> = ({ children }) => {
    const [nodeList, setNodeList] = useState(Object.values(coreNodeTypes));

    return (
        <NodeListContext.Provider value={{ nodeList, setNodeList }}>
            {children}
        </NodeListContext.Provider>
    );
};