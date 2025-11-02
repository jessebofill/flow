import { type FCChildren, useState } from 'react';
import { WatchViewContext } from '../../contexts/WatchViewContext';

export const WatchViewProvider: FCChildren<object> = ({ children }) => {
    const [watched, setWatched] = useState<string[]>([]);

    console.log('wwatched', watched)

    return (
        <WatchViewContext.Provider value={{ watched, setWatched }}>
            {children}
        </WatchViewContext.Provider>
    );
};