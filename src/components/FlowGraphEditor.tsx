import { type NodeChange, applyNodeChanges, type EdgeChange, type Edge, type Node, applyEdgeChanges, type Connection, addEdge, ReactFlow, Background, type NodeMouseHandler, type Viewport, type IsValidConnection, useViewport, SelectionMode } from '@xyflow/react';
import { type FC, useContext, useCallback, useRef, useState, createContext, useEffect } from 'react';
import { GraphStateContext } from '../contexts/GraphStateContext';
import { allNodeTypes } from '../const/nodeTypes';
import { bangInHandleId, basicEdgeTypeName, nodeCreatorNodeId, nodeCreatorTypeName } from '../const/const';
import { NodeList } from './NodeList';
import { ContextMenu } from './ContextMenu';
import { getNodeHandleType, validateConnection } from '../const/utils';
import { edgeTypes } from '../const/edgeTypes';
import type { TBasicEdge } from './BasicEdge';
import { CreateNodeCallback, NodeCreatorContext } from '../contexts/NodeCreatorContext';
import { SidebarMenu } from './SidebarMenu';
import { ConnectionLine } from './ConnectionLine';

export const FlowGraphEditor: FC<object> = () => {
    const { masterNodes, masterEdges, setMasterNodes, setMasterEdges } = useContext(GraphStateContext);
    const { isCreatingNode } = useContext(NodeCreatorContext);
    const viewport = useViewport();
    const [menu, setMenu] = useState(null);
    const ref = useRef<HTMLDivElement>(null);
    const edgeReconnectSuccessful = useRef(true);

    const onNodesChange = useCallback(
        (changes: NodeChange<Node>[]) => {
            // console.log('changes', changes)
            const removedIds = changes.filter(change => change.type === 'remove').map(change => change.id);

            if (removedIds.length > 0) {
                setMasterEdges(prevEdges => prevEdges.filter(edge => !removedIds.includes(edge.source) && !removedIds.includes(edge.target)));
            }
            setMasterNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot));
        },
        [setMasterEdges, setMasterNodes]
    );
    const onEdgesChange = useCallback(
        (changes: EdgeChange<Edge>[]) => {
            console.log('edges changes', changes)
            setMasterEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot))
        },
        [setMasterEdges]
    );
    const onConnect = useCallback(
        (connection: Connection) => {
            console.log(connection)
            setMasterEdges((edgesSnapshot) => {
                const { source, sourceHandle, target, targetHandle } = connection;
                const alreadyExists = edgesSnapshot.some((e) => e.source === source && e.sourceHandle === sourceHandle && e.target === target && e.targetHandle === targetHandle);
                if (alreadyExists) return edgesSnapshot;

                const getTypeFrom: [string, string] = source === nodeCreatorNodeId ? [target, targetHandle!] : [source, sourceHandle!];
                const dataType = getNodeHandleType(...getTypeFrom);
                const edge = {
                    ...connection,
                    type: basicEdgeTypeName,
                    selectable: false,
                    data: { dataType: dataType }
                } as TBasicEdge

                //do not allow multiple connection from same source handle of nodecreator
                const filtered = edgesSnapshot.filter((e) => !(e.source === nodeCreatorNodeId && e.sourceHandle === sourceHandle))
                    //do not allow multiple connections to same target handle except for bang
                    .filter((e) => !(e.target === target && e.targetHandle === targetHandle && targetHandle !== bangInHandleId));
                return addEdge(edge, filtered);
            });
        },
        [setMasterEdges]
    );

    const onReconnectStart = useCallback(() => {
        edgeReconnectSuccessful.current = false;
    }, []);

    const onReconnect = useCallback((oldEdge: Edge, newConnection: Connection) => {
        edgeReconnectSuccessful.current = true;
        setMasterEdges((edgesSnapshot) => {
            const { source, sourceHandle, target, targetHandle } = newConnection;
            const alreadyExists = edgesSnapshot.some((e) => e.source === source && e.sourceHandle === sourceHandle && e.target === target && e.targetHandle === targetHandle);
            if (alreadyExists) return edgesSnapshot;

            const getTypeFrom: [string, string] = source === nodeCreatorNodeId ? [target, targetHandle!] : [source, sourceHandle!];
            const dataType = getNodeHandleType(...getTypeFrom);
            const edge = {
                ...newConnection,
                type: basicEdgeTypeName,
                selectable: false,
                data: { dataType: dataType }
            } as TBasicEdge

            const filtered = edgesSnapshot.filter((e) => !(e === oldEdge || e.source === nodeCreatorNodeId && e.sourceHandle === sourceHandle))
                .filter((e) => !(e.target === target && e.targetHandle === targetHandle && targetHandle !== bangInHandleId));
            return addEdge(edge, filtered);
        });
    }, [setMasterEdges]);

    const onReconnectEnd = useCallback((_: unknown, edge: { id: string; }) => {
        if (!edgeReconnectSuccessful.current) {
            setMasterEdges((eds) => eds.filter((e) => e.id !== edge.id));
        }
        edgeReconnectSuccessful.current = true;
    }, [setMasterEdges]);

    const onNodeContextMenu: NodeMouseHandler = useCallback(
        (event, node) => {
            // Prevent native context menu from showing
            event.preventDefault();

            // Calculate position of the context menu. We want to make sure it
            // doesn't get positioned off-screen.
            const pane = ref.current.getBoundingClientRect();
            setMenu({
                id: node.id,
                top: event.clientY < pane.height - 200 && event.clientY,
                left: event.clientX < pane.width - 200 && event.clientX,
                right: event.clientX >= pane.width - 200 && pane.width - event.clientX,
                bottom:
                    event.clientY >= pane.height - 200 && pane.height - event.clientY,
            });
        },
        [setMenu],
    );

    const onPaneClick = useCallback(() => setMenu(null), [setMenu]);

    const setNodeCreator = useCallback((viewport: Viewport, add?: boolean) => {
        const pane = ref.current!.getBoundingClientRect();
        const inset = 10; // pixels from left edge of screen
        const width = pane.width - inset * 2;
        const height = pane.height - inset * 2;
        const canvasX = (inset - viewport.x) / viewport.zoom;
        const canvasY = (inset - viewport.y) / viewport.zoom;
        const nodeCreator = {
            id: nodeCreatorNodeId,
            type: nodeCreatorTypeName,
            position: { x: canvasX, y: canvasY },
            draggable: false,
            // selectable: false,
            focusable: false,
            style: {
                zIndex: '-1000',
                transform: `scale(${1 / viewport.zoom})`,
                left: canvasX,
                top: canvasY,
                height: `${height}px`,
                width: `${width}px`,
                cursor: 'grab'
            },
            data: {},
        };

        setMasterNodes(nodes => {
            if (add && !isCreatingNode) return [...nodes, nodeCreator];
            if (nodes.some(node => node.type === nodeCreatorTypeName)) return [...nodes.filter(n => n.type !== nodeCreatorTypeName), nodeCreator];
            return nodes;
        });
    }, [isCreatingNode, setMasterNodes]);

    useEffect(() => {
        if (!ref.current) return;
        const observer = new ResizeObserver(() => setNodeCreator(viewport));
        observer.observe(ref.current);

        return () => observer.disconnect();
    }, [viewport, setNodeCreator]);


    const isValidConnection: IsValidConnection = useCallback((connection) => validateConnection(connection, masterEdges), [masterEdges]);

    return (
        <div className="dndflow">
            <div
                className='reactflow-wrapper'
            // style={{ width: '100vw', height: '100vh' }}
            >
                <ReactFlow
                    ref={ref}
                    nodeTypes={allNodeTypes}
                    edgeTypes={edgeTypes}
                    nodes={masterNodes}
                    edges={masterEdges}
                    connectionLineComponent={ConnectionLine}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onReconnectStart={onReconnectStart}
                    onReconnect={onReconnect}
                    onReconnectEnd={onReconnectEnd}
                    reconnectRadius={20}
                    nodesFocusable={false}
                    edgesFocusable={false}
                    panOnDrag={[1]}
                    selectionMode={SelectionMode.Partial}
                    selectionOnDrag={true}
                    connectOnClick={false}
                    proOptions={{ hideAttribution: true }}
                    edgesReconnectable={true}
                    onNodeContextMenu={onNodeContextMenu}
                    onPaneClick={onPaneClick}
                    onViewportChange={setNodeCreator}
                    isValidConnection={isValidConnection}
                    minZoom={isCreatingNode ? 0.5 : 0.3}
                    maxZoom={isCreatingNode ? 1.1 : 5}
                    autoPanOnConnect={!isCreatingNode}
                    autoPanOnNodeDrag
                >
                    {/* <Controls /> */}
                    {/* <Panel position='center-left'
                        style={{ height: '100%' }}
                    >
                        sdfsdfsf
                        <WatchView />
                    </Panel> */}
                    {/* <MiniMap/> */}
                    {menu && <ContextMenu onClick={onPaneClick} {...menu} />}
                    <Background />
                </ReactFlow>
            </div>
            <CreateNodeCallback.Provider value={{ createNode: () => setNodeCreator(viewport, true) }}>
                <SidebarMenu />
            </CreateNodeCallback.Provider>
        </div>
    );
};