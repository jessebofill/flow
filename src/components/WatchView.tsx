import { useContext, type ReactNode } from 'react';
import { WatchViewContext } from '../contexts/WatchViewContext';
import { nodeInstanceRegistry } from './nodes/NodeBase copy';
import { outputHandleId } from '../const/const';

export const WatchView = () => {
    const { watched, setWatched } = useContext(WatchViewContext);
    return watched.map(nodeId => {
        const node = nodeInstanceRegistry.get(nodeId);
        if (!node) throw new Error('Could not find node instance in the registry');

        const output = node.state[outputHandleId] as ReactNode;
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