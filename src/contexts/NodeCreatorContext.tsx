import { createContext } from 'react';

export enum NodeCreatorStatus {
    None,
    Creating,
    Editing
}


export interface NodeCreatorContextData {
    nodeCreatorStatus: NodeCreatorStatus;
    setNodeCreatorStatus: React.Dispatch<React.SetStateAction<NodeCreatorStatus>>;
    isNodeCreatorOpen: boolean;
};

export const NodeCreatorContext = createContext<NodeCreatorContextData>({
    nodeCreatorStatus: NodeCreatorStatus.None,
    setNodeCreatorStatus: () => { },
    isNodeCreatorOpen: false
});

export const NodeCreatorCallbacks = createContext({ createNode: () => { }, editNode: (rfTypeIdentifier: string) => { } });