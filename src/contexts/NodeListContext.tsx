import { createContext } from 'react';
import type { NodeClass } from '../types/types';
import { Tags } from '../const/tags';

export interface NodeListContextData {
    nodeList: NodeClass[];
    tag: Tags;
    setTag: React.Dispatch<React.SetStateAction<Tags>>;
}

export const NodeListContext = createContext<NodeListContextData>({ nodeList: [], tag: Tags.All, setTag: () => { } });
