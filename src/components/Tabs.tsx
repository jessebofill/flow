import { type ReactElement, type FC, useState, useRef } from 'react';

export interface TabData {
    id: string;
    label: string;
    icon: ReactElement;
    content: ReactElement;
    header?: ReactElement;
};

export interface TabsProps {
    tabs: TabData[];
    tabBarStartExtraElt?: ReactElement;
    tabBarEndExtraElt?: ReactElement;
};

export const Tabs: FC<TabsProps> = ({ tabBarStartExtraElt, tabBarEndExtraElt, tabs }) => {
    const [activeTab, setActiveTab] = useState(tabs[0].id);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const activeIndex = tabs.findIndex(tab => tab.id === activeTab);

    return (
        <div className='tabs' style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex' }}>
                {tabBarStartExtraElt && <div style={{ display: 'flex', alignItems: 'end', paddingLeft: '4px' }}>
                    {tabBarStartExtraElt}
                </div>}
                <div style={{
                    display: 'flex',
                    gap: '8px',
                    padding: '0 4px',
                    overflow: 'clip',
                    // background: '#27282d',
                    flex: '1'
                }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`tab-button ${activeTab === tab.id ? 'active-tab' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                position: 'relative',
                                bottom: '-8px',
                                // background: '#211f28',
                                padding: '5px 8px',
                                flex: '1',
                                display: 'flex',
                                justifyContent: 'center'
                            }}
                        >
                            {tab.icon}
                        </button>
                    ))}
                </div>
                {tabBarEndExtraElt && <div style={{ display: 'flex', alignItems: 'end', paddingRight: '4px' }}>
                    {tabBarEndExtraElt}
                </div>}
            </div>
            <div
                ref={containerRef}
                style={{
                    height: '100%',
                    width: '100%',
                    overflow: 'hidden',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        transform: `translateX(-${activeIndex * 100 / tabs.length}%)`,
                        transition: 'transform 0.3s ease',
                        width: `${tabs.length * 100}%`,
                        height: '100%'
                    }}
                >
                    {tabs.map(tab => (
                        <div
                            key={tab.id}
                            style={{
                                width: `${100 / tabs.length}%`,
                                flexShrink: 0,
                                display: 'flex',
                                flexDirection: 'column',
                            }}
                        >
                            <div
                                className='header'
                                style={{ padding: '5px 10px 10px' }}
                            >
                                <div
                                    style={{
                                        fontSize: '16px',
                                        fontWeight: 'bold',
                                        marginBottom: '10px'
                                    }}
                                >
                                    {tab.label}
                                </div>
                                {tab.header}
                            </div>
                            <div style={{ overflowY: 'auto', flex: '1', padding: '10px' }}>
                                {tab.content}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
