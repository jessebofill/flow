import { useEffect, useRef, useState, type FC } from 'react';
import { NodeList, NodeListHeader } from './NodeList';
import { AiOutlineNodeIndex } from 'react-icons/ai';
import { IoMdEye } from 'react-icons/io';
import { type TabData, Tabs } from './Tabs';
import { TbLayoutSidebarRightCollapse, TbLayoutSidebarRightExpand } from 'react-icons/tb';
import { PiTreeStructure } from 'react-icons/pi';
import { GraphManager, GraphManagerHeader } from './GraphManager';

export const SidebarMenu: FC = () => {
    const [width, setWidth] = useState(240);
    const [collapsed, setCollapsed] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [mouseDown, setMouseDown] = useState(false);
    const widthRef = useRef(width);
    const outerRef = useRef<HTMLDivElement>(null);
    const innerRef = useRef<HTMLDivElement>(null);
    const minWidth = 200;
    const maxWidth = 600;
    const transitionTimingFunction = 'ease-in-out'
    const transitionDuration = '.5s'

    const tabs: TabData[] = [
        {
            id: 'node-list',
            label: 'Nodes',
            icon: <AiOutlineNodeIndex />,
            content: <NodeList />,
            header: <NodeListHeader />
        },
        {
            id: 'watchlist',
            label: 'Watchlist',
            icon: <IoMdEye />,
            content: <div />,
            header: <div />
        },
        {
            id: 'graph',
            label: 'Graph Manager',
            // icon: <PiGraph />,
            icon: <PiTreeStructure />,
            content: <GraphManager />,
            header: <GraphManagerHeader />
        }
    ];

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

    useEffect(() => {
        const handleDown = () => setMouseDown(true);
        const handleUp = () => setMouseDown(false);

        window.addEventListener('mousedown', handleDown, true);
        window.addEventListener('mouseup', handleUp, true);
        return () => {
            window.removeEventListener('mousedown', handleDown, true);
            window.removeEventListener('mouseup', handleUp, true);
        };
    }, []);

    const openClose = () =>
        setCollapsed(prev => {
            if (outerRef.current) outerRef.current.style.width = `${prev ? width : 0}px`;
            return !prev
        });

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
            <div className={`sidebar-hover-zone ${collapsed ? 'active' : 'inactive'} ${!mouseDown ? 'mouse-up' : ''}`}>
                <div
                    onClick={openClose}
                    className="sidebar-open-button"
                >
                    <TbLayoutSidebarRightExpand size={'1.8em'} />
                </div>
            </div>
            <div
                className='sidebar-resizer'
                onMouseDown={handleDrag}
                style={{ pointerEvents: collapsed ? 'none' : 'all' }}
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
                <Tabs tabs={tabs} tabBarStartExtraElt={
                    <div className='sidebar-close-button' onClick={openClose} style={{ display: 'flex', cursor: 'pointer', paddingBottom: '2px' }}>
                        <TbLayoutSidebarRightCollapse size={'2em'} />
                    </div>
                } />
            </aside>
        </div>
    );
};