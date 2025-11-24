import { useContext, useEffect, useState } from 'react';
import { WatchViewContext } from '../contexts/WatchViewContext';
import { mainOutputHandleId } from '../const/const';
import { globalNodeInstanceRegistry } from '../const/nodeTypes';
import { GraphStateContext } from '../contexts/GraphStateContext';
import { EventNotifier, Events } from '../EventNotifier';
import { highlight, unhiglight } from '../const/utils';
import { NodeTitle } from './NodeTitle';
import { useReactFlow } from '@xyflow/react';

export const WatchView = () => {
    const { watched, setWatched } = useContext(WatchViewContext);
    const graphState = useContext(GraphStateContext);
    const { fitView } = useReactFlow();
    const { masterNodes: nodes } = graphState;
    const [_, setUpdate] = useState(0);
    useEffect(() => EventNotifier.listen(Events.NodeUpdate, ({ id }) => watched.includes(id) && setUpdate(prev => prev + 1)), []);
    useEffect(() => {
        const removed = watched.filter(watchedId => !nodes.some(node => node.id === watchedId));
        if (removed.length) setWatched(_watched => _watched.filter(watchedId => !removed.includes(watchedId)));
    }, [nodes]);

    const highlightNode = (nodeId: string) => highlight(graphState, [{ nodeId, handleId: '' }], []);

    return watched.map(nodeId => {
        const node = globalNodeInstanceRegistry.get(nodeId);
        if (!node) throw new Error('Could not find node instance in the registry');

        const output = String(node.state.handles[mainOutputHandleId]);
        return (
            <div
                key={nodeId}
                className='sidebar-highlightable'
                style={{ fontSize: '18px', padding: '3px 6px', borderRadius: '4px' }}
                onMouseOver={() => highlightNode(nodeId)}
                onMouseOut={() => unhiglight(graphState)}
                onClick={() => fitView({
                    maxZoom: 1,
                    padding: 0.3,
                    duration: 500,
                    ease: t => t * (2 - t),
                    interpolate: 'smooth',
                    nodes: [{ id: nodeId }]
                })}
            >
                <div style={{ overflow: 'hidden' }}>
                    <NodeTitle
                        name=''
                        label={node.saveableState.label}
                        requireButton={false}
                        onChange={title => {
                            node.onTitleChange(title);
                            setUpdate(prev => prev + 1);
                            node.forceUpdate();
                        }}
                    />
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div
                        className='alt-text'
                        style={{ fontSize: '13px', textTransform: 'uppercase', fontStyle: 'italic' }}>{node.name}</div>
                    <div style={{ textAlign: 'right' }}>
                        {output}
                    </div>
                </div>
            </div>
        );
    });
};