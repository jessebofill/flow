import { createContext } from 'react';

export interface NodeCreatorContextData {
    isCreatingNode: boolean;
    setIsCreatingNode: React.Dispatch<React.SetStateAction<boolean>>;
};

export const NodeCreatorContext = createContext<NodeCreatorContextData>({
    isCreatingNode: false,
    setIsCreatingNode: () => { },
});

export const CreateNodeCallback = createContext({ createNode: () => { } });