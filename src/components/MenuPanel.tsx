import type { FC } from 'react';
import { Panel, useReactFlow, type XYPosition } from '@xyflow/react';
import { useCallback, useRef, useState } from 'react';
import { createNodeFromClassDef, nodeTypes } from '../const/nodeTypes';
import type { NodeClass } from '../types/types';
import { useDraggable } from '@neodrag/react';

export const MenuPanel: FC<object> = () => {
    console.log('menu render')
    const { setNodes, screenToFlowPosition } = useReactFlow();
    const [open, setOpen] = useState(true);


    const addNode = useCallback(
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
            if (isInFlow) setNodes((nds) => nds.concat(newNode));
        },
        [setNodes, screenToFlowPosition],
    );

    return (
        <aside>
            {/* <div
                style={{
                    display: 'flex',
                    flexDirection: 'row-reverse',
                    alignItems: 'center',
                    padding: '0 10px 15px'
                }}
            >
                <div
                    style={{
                        background: '#27282d',
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        fontSize: 24,
                        display: 'flex',
                        alignItems: 'end',
                        justifyContent: 'center',
                        cursor: 'pointer',
                    }}
                    onClick={() => setOpen((prev) => !prev)}
                >
                    +
                </div>
            </div> */}
            {/* {open && (
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        background: '#27282d',
                        padding: '10px',
                        borderRadius: '4px',
                        overflowY: 'auto',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    }}
                > */}
            {Object.values(nodeTypes).map(node => (
                <DraggableNode key={node.defNodeName} nodeClass={node} onDrop={addNode}>
                    {node.defNodeName}
                </DraggableNode>
            )
            )}
            {/* </div>
            )} */}
        </aside>

    );
};


interface DraggableNodeProps {
    className?: string;
    children: React.ReactNode;
    nodeClass: NodeClass;
    onDrop: (nodeClass: NodeClass, position: XYPosition) => void;
}

function DraggableNode({ className, children, nodeClass, onDrop }: DraggableNodeProps) {
    const draggableRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState<XYPosition>({ x: 0, y: 0 });

    useDraggable(draggableRef as unknown as React.RefObject<HTMLElement>, {
        position: position,
        onDrag: ({ offsetX, offsetY }) => {
            setPosition({
                x: offsetX,
                y: offsetY,
            });
        },
        onDragEnd: ({ event }) => {
            setPosition({ x: 0, y: 0 });
            onDrop(nodeClass, {
                x: event.clientX,
                y: event.clientY,
            });
        },
    });

    return (
        <div className={'dndnode'} ref={draggableRef}>
            {children}
        </div>
    );
};