import { type FCChildren, useState } from 'react';
import { NodeCreatorContext } from '../contexts/NodeCreatorContext';

export const NodeCreatorContextProvider: FCChildren<object> = ({ children }) => {
    const [isCreatingNode, setIsCreatingNode] = useState(false);

    return (
        <NodeCreatorContext.Provider value={{ isCreatingNode, setIsCreatingNode }}>
            {children}
        </NodeCreatorContext.Provider>
    );
};