import { forwardRef, type FC, type HTMLAttributes } from 'react';
import type { NodeClass } from '../types/types';
import { MdDragIndicator } from 'react-icons/md';
import { useDraggable } from '@dnd-kit/core';

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
    const { attributes, listeners, setNodeRef } = useDraggable({
        id: nodeClass.defNodeName,
        data: { nodeClass }
    });

    return <NodeListPreview ref={setNodeRef} nodeClass={nodeClass} {...attributes} {...listeners} {...props} />;
};