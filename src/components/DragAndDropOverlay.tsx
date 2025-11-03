import { type DragStartEvent, useDndMonitor, DragOverlay, type DragEndEvent } from '@dnd-kit/core';
import { useReactFlow, type XYPosition } from '@xyflow/react';
import { useCallback, useRef, useState, type FC, type MouseEvent } from 'react';
import type { NodeClass } from '../types/types';
import { NodeListPreview } from './NodeListPreview';
import { createNodeFromClassDef } from '../const/nodeTypes';

export const DragAndDropOverlay: FC<object> = () => {
    const { addNodes, screenToFlowPosition } = useReactFlow();
    const [dragged, setDragged] = useState<{ nodeClass: NodeClass } | null>(null);
    const mouseRef = useRef<XYPosition>({ x: 0, y: 0 });

    const onMouseMove = useCallback((event: MouseEvent) => {
        mouseRef.current = {
            x: event.clientX,
            y: event.clientY,
        };
    }, []);

    const add = useCallback(
        (nodeClass: NodeClass, screenPosition: XYPosition) => {
            const flow = document.querySelector('.react-flow');
            const flowRect = flow?.getBoundingClientRect();
            const isInFlow =
                flowRect &&
                screenPosition.x >= flowRect.left &&
                screenPosition.x <= flowRect.right &&
                screenPosition.y >= flowRect.top &&
                screenPosition.y <= flowRect.bottom;

            const position = screenToFlowPosition(screenPosition);
            const newNode = createNodeFromClassDef(nodeClass, position);
            if (isInFlow) addNodes(newNode);
        },
        [addNodes, screenToFlowPosition],
    );

    const onDragStart = (event: DragStartEvent) => {
        if (event.active.data?.current?.nodeClass) {
            const nodeClass = event.active.data.current!.nodeClass;
            setDragged({ nodeClass });
        }
    };

    const onDragEnd = (event: DragEndEvent) => {
        setDragged(null);
        if (dragged && event.over) add(dragged.nodeClass, mouseRef.current);
    };

    useDndMonitor({ onDragStart, onDragEnd });

    return (
        <div onMouseMove={onMouseMove}>
            <DragOverlay dropAnimation={null}>
                {dragged ? <NodeListPreview {...dragged} className='ghost'/> : null}
            </DragOverlay>
        </div>
    );
};