import { forwardRef, useContext, useRef, type FC, type HTMLAttributes } from 'react';
import type { NodeClass } from '../types/types';
import { MdDragIndicator } from 'react-icons/md';
import { useDraggable } from '@dnd-kit/core';
import { MenuHeader, MenuItem, SubMenu } from '@szhsin/react-menu';
import { NodeCreatorCallbacks } from '../contexts/NodeCreatorContext';
import { Tags } from '../const/tags';
import { appDb } from '../database';
import { ContextMenu } from './ContextMenu';

type NodeListPreviewProps = {
    nodeClass: NodeClass;
} & HTMLAttributes<HTMLDivElement>

export const NodeListPreview = forwardRef<HTMLDivElement, NodeListPreviewProps>(({ nodeClass, className, ...props }, ref) => {
    return (
        <div ref={ref} key={nodeClass.defNodeName} className={`node-list-node-preview ${className ?? ''}`} {...props}>
            {nodeClass.defNodeName}
            <MdDragIndicator />
        </div>
    );
});

export const DraggableNodeListPreview: FC<NodeListPreviewProps> = ({ nodeClass, ...props }) => {
    const { editNode } = useContext(NodeCreatorCallbacks);
    const ref = useRef<HTMLDivElement>(null);
    const isUserNode = nodeClass.tags.includes(Tags.User);
    const { attributes, listeners, setNodeRef } = useDraggable({
        id: nodeClass.defNodeName,
        data: { nodeClass }
    });

    return (
        <>
            <NodeListPreview ref={(elt) => { setNodeRef(elt); ref.current = elt }} nodeClass={nodeClass} {...attributes} {...listeners} {...props} />
            <ContextMenu elementContextMenuRef={ref} >
                <MenuHeader>
                    {nodeClass.defNodeName}
                </MenuHeader>
                {isUserNode &&
                    <>
                        <MenuItem onClick={() => editNode(nodeClass.defNodeName)}>Edit</MenuItem>
                        <MenuItem onClick={() => console.log('Delete', nodeClass.defNodeName)}>Delete</MenuItem>
                        <SubMenu label='Graph Id'>
                            <MenuItem>{appDb.cache.userNodes[nodeClass.defNodeName].graphId}</MenuItem>
                        </SubMenu>
                    </>
                }
                <SubMenu label='Tags'>
                    {nodeClass.tags.filter(tag => tag !== Tags.All).map(tag =>
                        <MenuItem key={tag}>{tag}</MenuItem>
                    )}
                </SubMenu>
            </ContextMenu>
        </>
    );
};