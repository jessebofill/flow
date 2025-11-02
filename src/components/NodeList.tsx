import type { FC } from 'react';
import { useReactFlow, type XYPosition } from '@xyflow/react';
import { useCallback, useContext, useRef, useState } from 'react';
import { createNodeFromClassDef, coreNodeTypes } from '../const/nodeTypes';
import type { NodeClass } from '../types/types';
import { useDraggable } from '@neodrag/react';
import { BiAddToQueue } from 'react-icons/bi';
import { FaTag } from 'react-icons/fa6';
import { MdDragIndicator } from 'react-icons/md';
import Tippy from '@tippyjs/react';
import { CreateNodeCallback } from '../contexts/NodeCreatorContext';
import { NodeListContext } from '../contexts/NodeListContext';
import { tags } from '../const/tags';

export const NodeList: FC<object> = () => {
    const { addNodes, screenToFlowPosition } = useReactFlow();
    const { nodeList } = useContext(NodeListContext);

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

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {nodeList.map(node => (
                <DraggableNode key={node.defNodeName} nodeClass={node} onDrop={add}>
                    {node.defNodeName}
                    <MdDragIndicator />
                </DraggableNode>
            ))}
        </div>
    );
};

export const NodeListHeader: FC<{}> = () => {
    const { fitView } = useReactFlow();
    const { createNode } = useContext(CreateNodeCallback);

    return (
        <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: '1' }}>
                <TagSelector />
            </div>
            <Tippy
                content={'Create Node'}
                placement="top"
                arrow={false}
                animation="fade"
                duration={[400, 250]}>
                <button
                    className='main'
                    onClick={() => {
                        fitView({
                            maxZoom: 1.1,
                            minZoom: 0.5,
                            padding: 0.3,
                            duration: 500,
                            ease: t => t * (2 - t),
                            interpolate: 'smooth'
                        });
                        setTimeout(createNode, 100)
                    }}>
                    <BiAddToQueue />
                </button>
            </Tippy>
        </div>
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


interface TagSelectorProps {
    // onChange?: (selected: string) => void;
}

const TagSelector: FC<TagSelectorProps> = () => {
    const options = tags;
    const { setNodeList } = useContext(NodeListContext);
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState(options[0]);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleBlur = (e: React.FocusEvent) => {
        const next = e.relatedTarget as HTMLElement | null;

        if (!next || !dropdownRef.current?.contains(next)) {
            setOpen(false);
        }
    };

    return (
        <div className='dropdown' ref={dropdownRef} style={{ position: 'relative' }}>
            <div style={{ display: 'flex' }}>
                <button
                    className='trigger'
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flex: '1',
                        padding: '0 10px',
                        height: '30px',
                        background: '#1d1d20',
                        zIndex: '1001'
                    }}
                    onClick={() => setOpen((prev) => !prev)} onBlurCapture={handleBlur}>
                    {selected}
                    <FaTag />
                </button>
            </div>
            {open && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 5px)',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: 0,
                    margin: 0,
                    zIndex: 1000,
                    boxShadow: '#02021d 2px 2px 15px 0px',
                    width: '100%',
                    background: '#1b191c',
                    overflow: 'hidden',
                    borderRadius: '8px'
                }}>
                    {options.map((option) =>
                        <div
                            className={`option ${selected === option ? 'selected' : ''}`}
                            style={{ padding: '3px 10px' }}
                            onMouseDown={() => {
                                setSelected(option);
                                setOpen(false);
                                setNodeList(() => Object.values(coreNodeTypes).filter(node => node.tags.includes(option)));
                                // onChange?.(option);
                            }}
                        >
                            {option}
                        </div>
                    )}
                </div>
            )
            }
        </div >
    );
};