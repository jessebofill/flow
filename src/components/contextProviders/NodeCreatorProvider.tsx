import { type FCChildren, useState } from 'react';
import { NodeCreatorContext, NodeCreatorStatus } from '../../contexts/NodeCreatorContext';

export const NodeCreatorProvider: FCChildren<object> = ({ children }) => {
    const [nodeCreatorStatus, setNodeCreatorStatus] = useState(NodeCreatorStatus.None);
    const isNodeCreatorOpen = nodeCreatorStatus !== NodeCreatorStatus.None;

    return (
        <NodeCreatorContext.Provider value={{ nodeCreatorStatus, setNodeCreatorStatus, isNodeCreatorOpen }}>
            {children}
        </NodeCreatorContext.Provider>
    );
};