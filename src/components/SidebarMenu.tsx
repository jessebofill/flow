import { type FC } from 'react';
import { NodeList, NodeListHeader } from './NodeList';
import { AiOutlineNodeIndex } from 'react-icons/ai';
import { IoMdEye } from 'react-icons/io';
import { type TabData, Tabs } from './Tabs';

export const SidebarMenu: FC = () => {
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
        <aside style={{ overflow: 'none', position: 'relative', minWidth: '200px', padding: '0' }}>
            <Tabs tabs={tabs} />
        </aside>
    );
};