import { createContext } from 'react';

export interface WatchViewContextData {
    watched: string[];
    setWatched: React.Dispatch<React.SetStateAction<string[]>>;
};

export const WatchViewContext = createContext<WatchViewContextData>({
    watched: [],
    setWatched: () => { },
});