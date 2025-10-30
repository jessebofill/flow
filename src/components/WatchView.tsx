import { useContext, type ReactNode } from 'react';
import { WatchViewContext } from '../contexts/WatchViewContext';
import { mainOutputHandleId } from '../const/const';
import { globalNodeInstanceRegistry } from '../const/nodeTypes';

export const WatchView = () => {
    const { watched, setWatched } = useContext(WatchViewContext);
    return watched.map(nodeId => {
        const node = globalNodeInstanceRegistry.get(nodeId);
        if (!node) throw new Error('Could not find node instance in the registry');

        const output = node.state[mainOutputHandleId] as ReactNode;
        return (
            <div>
                <div>{node.id}</div>
                <div>
                    {output}
                </div>
            </div>
        );
    });
};