import { useCallback, useContext, type FC } from 'react';
import { useReactFlow } from '@xyflow/react';
import { WatchViewContext } from '../contexts/WatchViewContext';
import { v4 as uuid } from 'uuid';
import { MenuHeader, MenuItem, SubMenu } from '@szhsin/react-menu';

interface NodeContextMenuItemsProps {
    nodeId: string;
    type: string;
}

export const NodeContextMenuItems: FC<NodeContextMenuItemsProps> = ({ nodeId, type }) => {
    const { getNode, setNodes, addNodes } = useReactFlow();
    const { watched, setWatched } = useContext(WatchViewContext);

    const watchNode = useCallback(() => setWatched(prev => [...prev, nodeId]), [nodeId, setWatched]);

    const duplicateNode = useCallback(() => {
        const node = getNode(nodeId);
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
    }, [nodeId, getNode, addNodes]);

    const deleteNode = useCallback(() => setNodes((nodes) => nodes.filter((node) => node.id !== nodeId)), [nodeId, setNodes]);

    return (
        <>
            <MenuHeader>{type}</MenuHeader>
            {!watched.includes(nodeId) && <button onClick={watchNode}>Watch Output</button>}
            <MenuItem onClick={duplicateNode}>Duplicate</MenuItem>
            <MenuItem onClick={deleteNode}>Delete</MenuItem>
            <SubMenu label='Node Id'>
                <MenuItem>{nodeId}</MenuItem>
            </SubMenu>
        </>
    );
};
