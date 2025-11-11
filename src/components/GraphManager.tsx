import Tippy from '@tippyjs/react';
import { useContext, useEffect, useRef, useState, type FC, type MouseEvent, type RefObject } from 'react';
import { MdSaveAlt } from 'react-icons/md';
import { ModalContext } from '../contexts/ModalContext';
import { appDb, type SavedGraph, type SavedGraphNode } from '../database';
import { v4 as uuid } from 'uuid';
import { toast } from 'sonner';
import { globalNodeInstanceRegistry } from '../const/nodeTypes';
import { GraphStateContext } from '../contexts/GraphStateContext';
import { ProxyNode } from './nodes/core/ProxyNode';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';
import { TbCrosshair, TbTrashX } from 'react-icons/tb';
import { EventNotifier, Events } from '../EventNotifier';
import { useLoadGraph } from '../hooks/useLoadGraph';
import { NodeCreatorContext } from '../contexts/NodeCreatorContext';
import { MenuHeader, MenuItem, SubMenu } from '@szhsin/react-menu';
import { ContextMenu } from './ContextMenu';

type Item = {
    graphId: string;
    name: string;
    date?: number;
};

enum SortType {
    Name,
    Date
};

enum SortOrder {
    Asc,
    Desc
};

export const GraphManager: FC<{}> = () => {
    const handleContextMenuRef = useRef<((x: number, y: number) => void) | null>(null);
    const [menuItem, setMenuItem] = useState<Item | null>(null);
    const [_, setUpdate] = useState(0);
    const [sortBy, setSortBy] = useState<SortType>(SortType.Date);
    const [sortOrder, setSortOrder] = useState<SortOrder>(SortOrder.Desc);
    useEffect(() => EventNotifier.listen(Events.UpdateGraphList, () => setUpdate(prev => prev + 1)), []);

    const items: Item[] = Object.entries(appDb.cache.graphs)
        .filter(([_, graph]) => graph.name)
        .map(([graphId, { name, timestamp }]) => ({ graphId, name: name!, date: timestamp }));

    const handleSort = (column: SortType) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === SortOrder.Asc ? SortOrder.Desc : SortOrder.Asc);
        } else {
            setSortBy(column);
            setSortOrder(column === SortType.Date ? SortOrder.Desc : SortOrder.Asc);
        }
    };

    const sortedItems = [...items].sort((a, b) => {
        const valA = sortBy === SortType.Name ? a.name.toLowerCase() : a.date ?? 0;
        const valB = sortBy === SortType.Name ? b.name.toLowerCase() : b.date ?? 0;

        if (valA < valB) return sortOrder === SortOrder.Asc ? -1 : 1;
        if (valA > valB) return sortOrder === SortOrder.Asc ? 1 : -1;
        return 0;
    });

    const handleContextMenu = (item: Item, event: MouseEvent) => {
        event.preventDefault();
        setMenuItem(item);
        handleContextMenuRef.current?.(event.clientX, event.clientY);
    }

    return (
        <div className='graph-manager' style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '2px' }} >
            <div style={{ display: 'flex' }}>

                <div className='sort-header' style={{ flex: '1' }} onClick={() => handleSort(SortType.Name)}>
                    <div>
                        Name
                    </div>
                    {sortBy === SortType.Name ? (sortOrder === SortOrder.Asc ? <IoIosArrowUp /> : <IoIosArrowDown />) : ''}
                </div>
                <div className='sort-header' style={{ width: '40px', paddingRight: '5px' }} onClick={() => handleSort(SortType.Date)}>
                    Date
                    {sortBy === SortType.Date ? (sortOrder === SortOrder.Asc ? <IoIosArrowUp /> : <IoIosArrowDown />) : ''}
                </div>
            </div>
            {!sortedItems.length &&
                <div style={{ textAlign: 'center', fontSize: '11px', fontStyle: 'italic', marginTop: '10px' }}>
                    No saved graphs
                </div>
            }
            {sortedItems.map(item => (
                <div onContextMenu={(e) => handleContextMenu(item, e)} className='list-row' key={item.graphId} style={{}}>
                    <div style={{ flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '5px' }}>
                        {item.name}
                    </div>
                    <div style={{ fontSize: '10px', color: '#938d9c', width: '60px', textAlign: 'right' }}>
                        {item.date && new Date(item.date).toLocaleDateString('en-US', {
                            year: '2-digit',
                            month: '2-digit',
                            day: '2-digit'
                        })}
                    </div>
                </div>
            ))}
            {menuItem && <GraphContextMenu handleMenuRef={handleContextMenuRef} item={menuItem} />}
        </div >
    );
};

export const GraphManagerHeader: FC<{}> = () => {
    const { isNodeCreatorOpen } = useContext(NodeCreatorContext);
    const { showModal } = useContext(ModalContext);
    const [_, setUpdate] = useState(0);
    const showSave = () => showModal((close) => <SaveGraphModal close={close} />);
    useEffect(() => EventNotifier.listen(Events.NodesChange, () => setUpdate(x => x + 1)), []);

    return (
        <Tippy
            content={'Save Graph'}
            placement="top"
            arrow={false}
            animation="fade"
            duration={[400, 250]}>
            <button className='main' style={{ width: '100%' }} onClick={showSave} disabled={!globalNodeInstanceRegistry.size || isNodeCreatorOpen}>
                <MdSaveAlt style={{ transform: 'translateY(-2px)' }} />
            </button>
        </Tippy>
    );
};
interface SaveGraphModalProps {
    close: () => void;
}

const SaveGraphModal: FC<SaveGraphModalProps> = ({ close }) => {
    const { masterEdges: edges, masterNodes: nodes } = useContext(GraphStateContext);
    const [name, setName] = useState('');
    const exists = Object.entries(appDb.cache.graphs).find(([_, graph]) => graph.name === name.trim());
    const save = () => {
        const graphId = exists?.[0] ?? uuid();

        const nodeState = nodes.map((node): [string, SavedGraphNode] => {
            const nodeInstance = globalNodeInstanceRegistry.get(node.id);
            if (!nodeInstance) throw new Error('Could not find node instance in registry to save it state');
            if (nodeInstance instanceof ProxyNode) nodeInstance.saveSubGraphState();

            const state = {
                react: nodeInstance.state,
                other: nodeInstance.saveableState
            };
            return [node.id, { defNodeName: nodeInstance.name, initState: state, position: node.position }];
        })
        const graph: SavedGraph = {
            name: name.trim(),
            edges,
            nodes: Object.fromEntries(nodeState)
        }
        const store = appDb.putGraph(graphId, graph)

        store.then(() => {
            toast.success(`Graph "${name.trim()}" saved to the database.`);
        }).catch((e) => {
            toast.error(`Graph "${name.trim()}" failed to be saved to the databased.\n${e}}`);
        });
        EventNotifier.dispatch(Events.UpdateGraphList);
        close();
    }

    return (
        <div style={{ width: '400px', transition: 'height 1s' }}>
            <header>
                Save Graph
            </header>
            <div style={{ margin: '5px 0 20px' }}>
                <div className='destructive-text' style={{ minHeight: '20px', paddingBottom: '10px' }}>
                    {exists ? `Graph "${name}" already exists. Are you sure you want to overwrite it?` : ''}
                </div>
                <input style={{ width: '100%', fontSize: '20px' }} placeholder='Name' autoFocus={true} value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className='modal-buttons'>
                <button className={exists ? 'destructive' : ''} onClick={save}>
                    {exists ? 'Overwrite*' : 'Save As'}
                </button>
                <button onClick={close}>
                    Cancel
                </button>
            </div>
        </div>
    );
};

interface ConfirmDeleteModalProps {
    graphId: string;
    close: () => void;
}

const ConfirmDeleteModal: FC<ConfirmDeleteModalProps> = ({ graphId, close }) => {
    const name = appDb.cache.graphs[graphId].name;
    const onConfirm = async () => {
        try {
            await appDb.removeGraph(graphId);
            toast.info(`Graph "${name}" deleted from the database.`)
        } catch (e) {
            toast.error(`Graph "${name}" failed to be deleted from the database.\n${e}`)
        }
        EventNotifier.dispatch(Events.UpdateGraphList);
    };

    return (
        <div>
            <header>
                Delete {name}
            </header>
            <p>
                Are you sure you want to delete this graph? This cannot be undone.
            </p>
            <div className='modal-buttons'>
                <button className='destructive' onClick={() => {
                    onConfirm();
                    close();
                }}>
                    Delete
                </button>
                <button onClick={close}>
                    Cancel
                </button>
            </div>
        </div>
    );
};

interface GraphContextMenuProps {
    item: Item;
    handleMenuRef: RefObject<((x: number, y: number) => void) | null>;
}

const GraphContextMenu: FC<GraphContextMenuProps> = ({ item, handleMenuRef }) => {
    const { showModal } = useContext(ModalContext);
    const loadGraph = useLoadGraph();
    const deleteGraph = (graphId: string) => showModal((close) => <ConfirmDeleteModal graphId={graphId} close={close} />);

    return (
        <ContextMenu handleMenuOpenRef={handleMenuRef}>
            <MenuHeader>
                {item.name}
            </MenuHeader>
            <MenuItem onClick={() => loadGraph(item.graphId, { randomizeIds: true })} style={{ justifyContent: 'space-between' }}>
                Instantiate
                <TbCrosshair />
            </MenuItem>
            <MenuItem onClick={() => deleteGraph(item.graphId)} style={{ justifyContent: 'space-between' }}>
                Delete
                <TbTrashX />
            </MenuItem>
            <SubMenu label='Graph Id'>
                <MenuItem>{item.graphId}</MenuItem>
            </SubMenu>
        </ContextMenu>
    );
};