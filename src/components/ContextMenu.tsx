import React, { useCallback, useContext, type FC, type HTMLAttributes } from 'react';
import { useReactFlow } from '@xyflow/react';
import { WatchViewContext } from '../contexts/WatchViewContext';
import { v4 as uuid } from 'uuid';

interface ContextMenuProps extends HTMLAttributes<HTMLDivElement> {
    id: string;
    top: number;
    left: number;
    right: number;
    bottom: number;
}

export const ContextMenu: FC<ContextMenuProps> = ({ id, top, left, right, bottom, ...props }) => {
    const { getNode, setNodes, addNodes, setEdges } = useReactFlow();
    const { watched, setWatched } = useContext(WatchViewContext);

    const watchNode = useCallback(() => setWatched(prev => [...prev, id]), [id, setWatched]);

    const duplicateNode = useCallback(() => {
        const node = getNode(id);
        if (!node) throw new Error('Could not find node by id to duplicate');

        const position = {
            x: node.position.x + 50,
            y: node.position.y + 50,
        };

        addNodes({
            ...node,
            selected: false,
            dragging: false,
            id: uuid(),
            position,
        });
    }, [id, getNode, addNodes]);

    const deleteNode = useCallback(() => {
        setNodes((nodes) => nodes.filter((node) => node.id !== id));
        setEdges((edges) => edges.filter((edge) => edge.source !== id));
    }, [id, setNodes, setEdges]);

    return (
        <div
            style={{ top, left, right, bottom }}
            className="context-menu"
            {...props}
        >
            <p style={{ margin: '0.5em' }}>
                <small>node: {id}</small>
            </p>
            {!watched.includes(id) && <button onClick={watchNode}>Watch Output</button>}
            <button onClick={duplicateNode}>Duplicate</button>
            <button onClick={deleteNode}>Delete</button>
        </div>
    );
}
