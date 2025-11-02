import { useRef, useState, type FC } from 'react';
import { NodeList, NodeListHeader } from './NodeList';
import { AiOutlineNodeIndex } from 'react-icons/ai';
import { IoMdEye } from 'react-icons/io';
import { type TabData, Tabs } from './Tabs';

export const SidebarMenu: FC = () => {
    const [width, setWidth] = useState(240);
    const [collapsed, setCollapsed] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const widthRef = useRef(width);
    const outerRef = useRef<HTMLDivElement>(null);
    const innerRef = useRef<HTMLDivElement>(null);
    const minWidth = 200;
    const maxWidth = 600;
    const transitionTimingFunction = 'ease-in-out'
    const transitionDuration = '.5s'

    const handleDrag = (e: React.MouseEvent) => {
        const startX = e.clientX;
        const startWidth = widthRef.current;

        const onMouseMove = (moveEvent: MouseEvent) => {
            setIsDragging(true);
            const delta = startX - moveEvent.clientX;
            const newWidth = Math.min(Math.max(minWidth, startWidth + delta), maxWidth);
            widthRef.current = newWidth;

            if (outerRef.current) outerRef.current.style.width = `${newWidth}px`;
            if (innerRef.current) innerRef.current.style.width = `${newWidth}px`;
        };

        const onMouseUp = () => {
            setWidth(widthRef.current);
            setIsDragging(false);
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    const tabs: TabData[] = [
        {
            id: 'node-list',
            label: 'Nodes',
            icon: <AiOutlineNodeIndex />,
            content: <NodeList />,
            header: <NodeListHeader />
        },
        {
            id: 'node-list2',
            label: 'Watchlist',
            icon: <IoMdEye />,
            content: <div />,
            header: <div />
        }
    ];

    return (
        <div
            ref={outerRef}
            style={{
                position: 'relative',
                width: `${width}px`,
                minWidth: 0,
                maxWidth,
                transitionProperty: isDragging ? 'none' : 'width',
                transitionTimingFunction,
                transitionDuration
            }}>
            <button
                onClick={() => setCollapsed(prev => {
                    if (outerRef.current) outerRef.current.style.width = `${prev ? width : 0}px`;
                    return !prev

                })}
                style={{
                    position: 'absolute',
                    top: 10,
                    left: '-40px',
                    width: '30px',
                    height: '30px',
                    background: '#27282d',
                    border: 'none',
                    color: '#fff',
                    cursor: 'pointer',
                    zIndex: 10,
                }}
            >
                {collapsed ? '◀' : '▶'}
            </button>
            <div
                onMouseDown={handleDrag}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: '-3px',
                    width: '6px',
                    height: '100%',
                    cursor: 'ew-resize',
                    background: 'transparent',
                    zIndex: '1',
                    pointerEvents: collapsed ? 'none' : 'all'
                }}
            />
            <aside
                ref={innerRef}
                style={{
                    position: 'absolute',
                    width: `${width}px`,
                    minWidth,
                    maxWidth,
                    height: '100%',
                    overflow: 'hidden',
                    right: collapsed ? -(width) : 0,
                    transitionProperty: 'right',
                    transitionTimingFunction,
                    transitionDuration
                }}
            >
                <Tabs tabs={tabs} />
            </aside>
        </div>

    );
};