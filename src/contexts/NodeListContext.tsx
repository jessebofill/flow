import { createContext } from 'react';
import type { NodeClass } from '../types/types';

export interface NodeListContextData {
    nodeList: NodeClass[];
    setNodeList: React.Dispatch<React.SetStateAction<NodeClass[]>>;
}

export const NodeListContext = createContext<NodeListContextData>({ nodeList: [], setNodeList: () => { } });
